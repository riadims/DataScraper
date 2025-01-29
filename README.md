# DataScraper

A web application for extracting contact information from a list of websited based on keywords and country.

## Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)


## Features

- Extract contact information such as emails, phone numbers, and addresses.
- Target websites based on specific keywords.
- User-friendly web interface.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Make sure you have Node.js installed. The application requires version 14 or higher. You can download it from the [official Node.js website](https://nodejs.org/).
- **npm**: The Node package manager (npm) should be installed along with Node.js. Ensure you have npm version 6 or higher.
- **SerpApi API Key**: You will need a SerpApi API key to use the application. You can obtain one by signing up at [SerpApi](https://serpapi.com/).

Having these prerequisites in place will ensure a smooth installation and usage experience.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/ContactExtraction.git
    ```
2. Navigate to the project directory:
    ```bash
    cd ContactExtraction
    ```
3. Install the required dependencies:
    ```bash
    npm install
    ```

## Usage

1. Create a `.env` file in the root directory of the project.
2. Add the following lines to the `.env` file, replacing `YOUR_SERPAPI_API_KEY` with your actual SerpApi API key:
    ```
    SERPAPI_API_KEY=YOUR_SERPAPI_API_KEY
    PORT=30000
    ```
3. Start the application:
    ```bash
    npm start
    ```
4. Open your web browser and go to `http://localhost:3000`.
5. Enter the keywords and start extracting contact information.

You can obtain a SerpApi API key by signing up at [SerpApi](https://serpapi.com/).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is not licensed.
