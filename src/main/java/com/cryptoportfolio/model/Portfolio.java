package com.cryptoportfolio.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;
import java.util.HashMap;

@Document(collection = "portfolios")
public class Portfolio {
    @Id
    private String id;
    private String userId;
    private Map<String, Double> holdings;

    public Portfolio() {
        this.holdings = new HashMap<>();
    }

    public Portfolio(String userId) {
        this.userId = userId;
        this.holdings = new HashMap<>();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Map<String, Double> getHoldings() {
        return holdings;
    }

    public void setHoldings(Map<String, Double> holdings) {
        this.holdings = holdings;
    }
} 