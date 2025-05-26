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
} 