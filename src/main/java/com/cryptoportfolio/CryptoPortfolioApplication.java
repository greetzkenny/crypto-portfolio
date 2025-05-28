package com.cryptoportfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CryptoPortfolioApplication {
    public static void main(String[] args) {
        SpringApplication.run(CryptoPortfolioApplication.class, args);
    }
}
