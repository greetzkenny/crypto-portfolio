package com.cryptoportfolio.service;

import com.cryptoportfolio.model.CoinPrice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CoinGeckoService {

    private static final Logger logger = LoggerFactory.getLogger(CoinGeckoService.class);
    private final WebClient webClient;

    @Autowired
    public CoinGeckoService(WebClient coinGeckoWebClient) {
        this.webClient = coinGeckoWebClient;
    }

    public Flux<CoinPrice> getMarketData(List<String> coinIds, String currency) {
        String url = String.format("/coins/markets?vs_currency=%s&ids=%s&order=market_cap_desc&sparkline=false",
                currency, String.join(",", coinIds));
        logger.info("Calling CoinGecko API: {}", url);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToFlux(CoinPrice.class)
                .doOnNext(price -> logger.info("Received price for {}: {}", price.getId(), price.getCurrentPrice()))
                .doOnError(error -> logger.error("Error fetching market data: {}", error.getMessage()));
    }

    public Mono<CoinPrice> getCoinPrice(String coinId, String currency) {
        logger.info("Fetching price for coin: {} in currency: {}", coinId, currency);
        return getMarketData(List.of(coinId), currency)
                .next()
                .doOnSuccess(price -> logger.info("Successfully fetched price for {}", coinId))
                .doOnError(error -> logger.error("Error fetching price for {}: {}", coinId, error.getMessage()));
    }

    public Flux<String> getSupportedCoins() {
        logger.info("Fetching supported currencies");
        return webClient.get()
                .uri("/simple/supported_vs_currencies")
                .retrieve()
                .bodyToFlux(String.class)
                .doOnComplete(() -> logger.info("Successfully fetched supported currencies"))
                .doOnError(error -> logger.error("Error fetching supported currencies: {}", error.getMessage()));
    }
} 