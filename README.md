# Crypto Portfolio Manager

A modern web application for tracking cryptocurrency portfolios, built with Spring Boot and MongoDB.

## Features

- Real-time cryptocurrency price tracking using CoinGecko API
- User authentication and portfolio management
- Top 10 cryptocurrencies by market cap display
- Add/remove tokens from your portfolio
- Dark mode support
- Session persistence
- Responsive design with Tailwind CSS

## Tech Stack

- Backend:
  - Java 21
  - Spring Boot 3.2.3
  - Spring Security
  - MongoDB
  - JWT Authentication

- Frontend:
  - HTML5
  - JavaScript
  - Tailwind CSS
  - CoinGecko API Integration

## Prerequisites

- Java 21 or higher
- MongoDB 7.0 or higher
- Maven 3.9.9 or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Greetzkenny/crypto-portfolio.git
cd crypto-portfolio
```

2. Configure MongoDB:
- Install MongoDB if not already installed
- Make sure MongoDB is running on localhost:27017

3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

The application will be available at `http://localhost:8090`

## Configuration

Create `src/main/resources/application.properties` with the following content:
```properties
server.port=8090
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.database=portfolio-tracker
jwt.secret=your-secret-key
jwt.expiration=86400000
```

## Usage

1. Register a new account or login with existing credentials
2. View the top 10 cryptocurrencies by market cap
3. Add tokens to your portfolio using the '+' button
4. Remove tokens using the '-' button
5. Toggle dark mode using the theme button
6. Your session and preferences will be preserved across page refreshes

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) 