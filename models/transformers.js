// transformers.js
import { pipeline, env } from '@xenova/transformers';

// Enable caching in the browser’s IndexedDB:
env.allowLocalModels = false;
env.useBrowserCache = true;

// A single reference to our pipeline classifier (shared by all calls)
let classifier = null;

// A promise that represents the async pipeline load in progress
let pipelinePromise = null;

/**
 * Load the Zero-Shot Classifier exactly once. If it's already loading or loaded,
 * we reuse the same pipelinePromise so we don't accidentally create multiple classifiers.
 */
export async function loadModel() {
    // Already loaded? Return immediately.
    if (classifier) {
        return classifier;
    }
    // Already in the process of loading? Return that same promise.
    if (pipelinePromise) {
        return pipelinePromise;
    }

    console.log("⏳ Loading Zero-Shot Classifier Model (Xenova)...");

    // Kick off the async pipeline load and store the promise
    pipelinePromise = pipeline(
        'zero-shot-classification',
        'Xenova/nli-deberta-v3-small',
        {
            // Logs incremental download progress
            progress_callback: (progressObj) => {
                console.log(progressObj);
            }
        }
    )
    .then((loadedPipeline) => {
        console.log("✅ Model Loaded Successfully!");
        classifier = loadedPipeline; // store for all future calls
        return classifier;
    })
    .catch((err) => {
        console.error("❌ Model Loading Failed:", err);
        // If load fails, reset so we can retry on next call
        pipelinePromise = null;
        throw err;
    });

    return pipelinePromise;
}

/**
 * Classify a page title with the zero-shot classifier
 */
export async function classifyPage(title) {
    // Make sure the model is loading / loaded
    if (!classifier) {
        await loadModel(); // Wait for pipelinePromise if needed
    }

    // If it still didn't load (some fatal error?), bail out
    if (!classifier) {
        console.error("❌ Classifier is still undefined after attempting to load.");
        return "Uncategorized";
    }

    // Define the labels you want for classification
    const labels = [
        'News',
        'Technology & Development',
        'Entertainment',
        'Shopping',
        'Social Media',
        'Finance',
        'Education'
    ];

    try {
        // Use the pipeline to classify
        const result = await classifier(title, labels);
        console.log(`🔍 Classification Result for "${title}":`, result.labels[0]);
        return result.labels[0]; // top predicted category
    } catch (error) {
        console.error("❌ Classification Error:", error);
        return 'Uncategorized';
    }
}







