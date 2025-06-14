# Pixel Sorter

## Introduction

**Pixel Sorter** is an image processing application designed to create stunning visual effects by sorting pixels based on brightness, edge detection, or custom thresholds. This application is built using modern web technologies such as TypeScript, React, and Vite.

---

## Features

- **Threshold Mask Sorting**: Sort pixels based on brightness thresholds.
- **Edge Detection Sorting**: Sort pixels based on detected edges.
- **Customizable Sorting Pipeline**: Add, remove, or disable sorting steps.
- **Save and Load Configurations**: Save sorting parameters for reuse.
- **Gallery**: View previously processed images.

---

## Prerequisites

Before running the application, ensure you have the following installed on your system:

1. **Node.js** (version 16 or higher): Required to run the application and manage dependencies.
2. **npm**: Node.js package manager for installing dependencies.

---

## How to Run the Application from Source

### Step 1: Clone the Repository

Clone the Pixel Sorter repository to your local machine:

```bash
git clone https://github.com/viledeg/pixel-sorting.git
cd pixel-sorting
```

### Step 2: Install Dependencies

Install the required dependencies using npm:

```bash
npm install
```

### Step 3: Start the Development Server

Run the development server to start the application:

```bash
npm run dev
```

This will start the application and provide a local development URL (e.g., http://localhost:3000). Open this URL in your browser to access the application.

## File Structure

- `src/`: Contains the source code for the application.
- `components/`: React components for the application.
- `utils/`: Utility functions for image processing and sorting.
- `styles/`: Styled components for UI styling.
- `public/`: Static assets such as images and configuration files.
- `dist/`: Production build output (generated after running npm run build).

## Dependencies

### Runtime Dependencies

- react
- react-dom
- p5
- image-js
- styled-components
- js-yaml
- react-dropzone
- uuid
- use-debounce
- Development Dependencies
- typescript
- vite
- eslint
- prettier
- gh-pages
