package com.cryptoportfolio.repository;

import com.cryptoportfolio.model.PortfolioSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.Instant;
import java.util.List;

public interface PortfolioSnapshotRepository extends MongoRepository<PortfolioSnapshot, String> {
    @Query("{ 'userId': ?0, 'timestamp': { $gte: ?1 } }")
    List<PortfolioSnapshot> findByUserIdAndTimestampAfter(String userId, Instant timestamp);
    
    @Query(value = "{ 'userId': ?0 }", sort = "{ 'timestamp': -1 }")
    List<PortfolioSnapshot> findLatestByUserId(String userId, org.springframework.data.domain.Pageable pageable);
} 