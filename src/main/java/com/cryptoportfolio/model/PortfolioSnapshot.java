package com.cryptoportfolio.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.Map;

@Document(collection = "portfolio_snapshots")
public class PortfolioSnapshot {
    @Id
    private String id;
    private String userId;
    private Instant timestamp;
    private double totalValue;
    private Map<String, CoinSnapshot> holdings;

    public static class CoinSnapshot {
        private double amount;
        private double priceUsd;
        private double value;

        public CoinSnapshot() {}

        public CoinSnapshot(double amount, double priceUsd) {
            this.amount = amount;
            this.priceUsd = priceUsd;
            this.value = amount * priceUsd;
        }

        public double getAmount() {
            return amount;
        }

        public void setAmount(double amount) {
            this.amount = amount;
        }

        public double getPriceUsd() {
            return priceUsd;
        }

        public void setPriceUsd(double priceUsd) {
            this.priceUsd = priceUsd;
        }

        public double getValue() {
            return value;
        }

        public void setValue(double value) {
            this.value = value;
        }
    }

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

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public double getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(double totalValue) {
        this.totalValue = totalValue;
    }

    public Map<String, CoinSnapshot> getHoldings() {
        return holdings;
    }

    public void setHoldings(Map<String, CoinSnapshot> holdings) {
        this.holdings = holdings;
    }
} 