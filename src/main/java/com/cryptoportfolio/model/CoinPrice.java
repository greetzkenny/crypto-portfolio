package com.cryptoportfolio.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class CoinPrice {
    private String id;
    private String symbol;
    private String name;
    
    @JsonProperty("current_price")
    private BigDecimal currentPrice;
    
    @JsonProperty("price_change_percentage_1h_in_currency")
    private BigDecimal priceChangePercentage1h;
    
    @JsonProperty("price_change_percentage_24h")
    private BigDecimal priceChangePercentage24h;
    
    @JsonProperty("market_cap")
    private BigDecimal marketCap;
    
    @JsonProperty("total_volume")
    private BigDecimal totalVolume;
} 