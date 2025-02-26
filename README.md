# Histofy 📊
A Firefox browser extension that provides structured and categorized browsing history reports using a topic classifier and a frequency algorithm (frequency + recency). Get productivity insights right from your browser!

---

## 🚀 Features
- Categorized browsing history reports
- Frequency and recency-based analysis
- User-friendly and privacy-focused

---

## 💻 Tech Stack
- **Frontend:** Vanilla JavaScript, HTML, CSS (Firefox Extension)
- **NLP Models:** Transformers.js for topic classification
- **CI/CD:** GitHub Actions for linting, testing, and building

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18.x recommended)
- npm (v8.x recommended)

---

### Installation
```sh
# Clone the repository
git clone https://github.com/Firefox-Recap/Histofy.git

# Navigate to the project directory
cd Histofy

# Install dependencies
npm install

### Running the Extension Locally
```sh
# Open Firefox and navigate to:
about:debugging#/runtime/this-firefox

# Click on:
Load Temporary Add-on

# Select the file:
manifest.json from the project directory
```
---

## 🔒 Branch Rules & Contribution Guidelines

### Branch Rules
We enforce the following rules to maintain code quality and consistency:
- **Protected `main` Branch:**
  - All changes to `main` must go through a Pull Request (PR).
  - At least **1 approving review** is required before merging.
  - **No direct commits** to the `main` branch are allowed.
  - **Status checks** (Lint, Test, and Build) must pass before merging.
  - **Merge commits** are prohibited; a linear history is enforced.

### Working with Branches
1. **Create a Feature Branch:**
    ```sh
    git checkout -b feature/your-feature-name
    ```

2. **Commit your changes:**
    ```sh
    git add .
    git commit -m "feat: Add new feature"
    ```

3. **Push the branch to GitHub:**
    ```sh
    git push origin feature/your-feature-name
    ```

4. **Open a Pull Request:**
    - Go to the [repository on GitHub](https://github.com/Firefox-Recap/Histofy).
    - Open a Pull Request from your feature branch to `main`.
    - Ensure all checks pass and at least one reviewer approves before merging.

---

## 🤝 Contributing
Contributions are welcome! Please follow the branch rules and ensure all checks pass before requesting a review. Feel free to open issues or submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

---

## 🙏 Acknowledgments
- Thanks to the Mozilla AI team for their guidance.
- Special shoutout to **Peter Mitchell**, **Diego Valdez**, **Kate Sawtell**, and **Taimur Hasan** for their collaboration.

