package com.cryptoportfolio.repository;

import com.cryptoportfolio.model.Portfolio;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PortfolioRepository extends MongoRepository<Portfolio, String> {
    Optional<Portfolio> findByUserId(String userId);
} 