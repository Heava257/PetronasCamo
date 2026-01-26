
import * as faceapi from 'face-api.js';

export const getFaceApi = () => {
    // Check if the imported object has 'nets' or top level load functions
    if (faceapi.nets || faceapi.loadSsdMobilenetv1Model) {
        return faceapi;
    }
    // Check if default export has 'nets' (CommonJS interop)
    if (faceapi.default && (faceapi.default.nets || faceapi.default.loadSsdMobilenetv1Model)) {
        return faceapi.default;
    }

    // Inspect what we received
    console.warn("face-api.js import layout unexpected:", faceapi);

    // Last ditch: check global
    if (window.faceapi) {
        return window.faceapi;
    }

    return faceapi; // Return as is and hope for match on specific props
};
