package com.cryptoportfolio.controller;

import com.cryptoportfolio.model.Portfolio;
import com.cryptoportfolio.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:8090")
public class PortfolioController {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getPortfolio(@PathVariable String userId) {
        return portfolioRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new Portfolio(userId)));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<?> updatePortfolio(@PathVariable String userId, @RequestBody Portfolio portfolio) {
        portfolio.setUserId(userId);
        return ResponseEntity.ok(portfolioRepository.save(portfolio));
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<?> addHolding(@PathVariable String userId, @RequestBody HoldingRequest request) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElse(new Portfolio(userId));

        String symbol = request.getSymbol().toUpperCase();
        double currentAmount = portfolio.getHoldings().getOrDefault(symbol, 0.0);
        portfolio.getHoldings().put(symbol, currentAmount + request.getAmount());

        portfolioRepository.save(portfolio);
        return ResponseEntity.ok(portfolio);
    }

    @PostMapping("/{userId}/remove")
    public ResponseEntity<?> removeHolding(@PathVariable String userId, @RequestBody HoldingRequest request) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElse(new Portfolio(userId));

        String symbol = request.getSymbol().toUpperCase();
        double currentAmount = portfolio.getHoldings().getOrDefault(symbol, 0.0);
        double newAmount = currentAmount - request.getAmount();

        if (newAmount < 0) {
            return ResponseEntity.badRequest().body("Insufficient holdings");
        }

        if (newAmount == 0) {
            portfolio.getHoldings().remove(symbol);
        } else {
            portfolio.getHoldings().put(symbol, newAmount);
        }

        portfolioRepository.save(portfolio);
        return ResponseEntity.ok(portfolio);
    }

    private static class HoldingRequest {
        private String symbol;
        private double amount;

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public double getAmount() {
            return amount;
        }

        public void setAmount(double amount) {
            this.amount = amount;
        }
    }
} 