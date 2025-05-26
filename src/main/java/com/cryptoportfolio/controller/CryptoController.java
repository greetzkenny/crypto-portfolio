package com.cryptoportfolio.controller;

import com.cryptoportfolio.model.CoinPrice;
import com.cryptoportfolio.service.CoinGeckoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/crypto")
@CrossOrigin(origins = "*")
public class CryptoController {

    private static final Logger logger = LoggerFactory.getLogger(CryptoController.class);
    private final CoinGeckoService coinGeckoService;

    @Autowired
    public CryptoController(CoinGeckoService coinGeckoService) {
        this.coinGeckoService = coinGeckoService;
    }

    @GetMapping("/prices")
    public Mono<ResponseEntity<List<CoinPrice>>> getPrices(
            @RequestParam List<String> coins,
            @RequestParam(defaultValue = "usd") String currency) {
        logger.info("Received request for prices of coins: {} in currency: {}", coins, currency);
        return coinGeckoService.getMarketData(coins, currency)
                .collectList()
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> logger.info("Successfully returned prices for {} coins", coins.size()))
                .doOnError(error -> logger.error("Error getting prices: {}", error.getMessage()));
    }

    @GetMapping("/price/{coinId}")
    public Mono<ResponseEntity<CoinPrice>> getPrice(
            @PathVariable String coinId,
            @RequestParam(defaultValue = "usd") String currency) {
        logger.info("Received request for price of coin: {} in currency: {}", coinId, currency);
        return coinGeckoService.getCoinPrice(coinId, currency)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> logger.info("Successfully returned price for {}", coinId))
                .doOnError(error -> logger.error("Error getting price for {}: {}", coinId, error.getMessage()));
    }

    @GetMapping("/supported-currencies")
    public Mono<ResponseEntity<List<String>>> getSupportedCurrencies() {
        logger.info("Received request for supported currencies");
        return coinGeckoService.getSupportedCoins()
                .collectList()
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> logger.info("Successfully returned supported currencies"))
                .doOnError(error -> logger.error("Error getting supported currencies: {}", error.getMessage()));
    }
} 