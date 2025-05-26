package com.cryptoportfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    
    private static final String COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
    
    @Bean
    public WebClient coinGeckoWebClient() {
        return WebClient.builder()
                .baseUrl(COINGECKO_API_BASE_URL)
                .build();
    }
} 