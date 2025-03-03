import { pipeline, env } from '@xenova/transformers';

// Ensure we load from the web
env.allowLocalModels = false;

let classifier;
let isLoading = false;

// This promise ensures classification only runs after the model is loaded
let modelReady = new Promise((resolve, reject) => {
    loadModel().then(resolve).catch(reject);
});

// Load the model asynchronously
export async function loadModel() {
    if (isLoading) return; // Prevent duplicate loading
    isLoading = true;

    console.log("⏳ Loading Zero-Shot Classifier Model...");
    try {
        classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small');
        console.log("✅ Model Loaded Successfully!");
    } catch (error) {
        console.error("❌ Model Loading Failed:", error);
    } finally {
        isLoading = false;
    }
}

// Function to classify a page based on title
export async function classifyPage(title) {
    // Wait until the model is ready
    await modelReady;

    if (!classifier) {
        console.error("❌ Classifier is still undefined after loading.");
        return "Uncategorized";
    }

    const labels = ['News', 'Technology & Development', 'Entertainment', 'Shopping', 'Social Media', 'Finance', 'Education'];

    try {
        const result = await classifier(title, labels);
        console.log(`🔍 Classification Result for "${title}":`, result.labels[0]);
        return result.labels[0]; // Most relevant category
    } catch (error) {
        console.error("❌ Classification Error:", error);
        return 'Uncategorized';
    }
}



