export const isObject = (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

export const deepMerge = (target, source) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target) || !isObject(target[key])) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else if (Array.isArray(source[key])) {
                if (source[key] !== undefined) {
                    // If source array is empty and target has initial items, prefer target's initial structure.
                    // This is a basic heuristic; complex array merging might need specific logic per field.
                    if (source[key].length === 0 && Array.isArray(target[key]) && target[key].length > 0) {
                         // Check if target is not just an empty array placeholder from initial data
                        const targetIsNotEmptyPlaceholder = target[key].some(item => Object.keys(item).length > 0);
                        if(targetIsNotEmptyPlaceholder){
                            output[key] = [...target[key]];
                        } else {
                            output[key] = [...source[key]]; // source is empty, target was placeholder
                        }
                    } else {
                         output[key] = [...source[key]];
                    }
                } else if (target[key] !== undefined) {
                    output[key] = [...target[key]];
                } else {
                    output[key] = [];
                }
            } else {
                 if (source[key] !== undefined) {
                    Object.assign(output, { [key]: source[key] });
                } else if (target[key] !== undefined && target[key] !== null) { // Keep target if source is undefined
                    Object.assign(output, { [key]: target[key] });
                } else {
                     Object.assign(output, { [key]: source[key] }); // Let source (undefined) overwrite if target also undefined/null
                }
            }
        });
    }
    return output;
};

export const setNestedValue = (obj, path, value) => {
    const keys = Array.isArray(path) ? path : path.split('.');
    const result = { ...obj }; // Create a shallow copy first
    let current = result;
    
    // Navigate to the parent of the target property, creating copies along the way
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
        } else {
            // Create a copy of the nested object to maintain immutability
            current[keys[i]] = { ...current[keys[i]] };
        }
        current = current[keys[i]];
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value;
    
    // Return the new object instead of mutating the original
    return result;
};
