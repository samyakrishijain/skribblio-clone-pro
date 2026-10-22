const WORD_BANK = {
    animals: [
        "cat", "dog", "elephant", "giraffe", "dolphin", "penguin", "kangaroo", "tiger", "lion",
        "monkey", "panda", "koala", "rabbit", "whale", "octopus", "turtle", "zebra", "chameleon",
        "flamingo", "hedgehog", "sloth", "owl", "crocodile", "squirrel", "peacock", "shark",
        "butterfly", "jellyfish", "hamster", "camel", "hippo", "lobster", "eagle", "bear"
    ],
    food: [
        "pizza", "burger", "sushi", "taco", "ice cream", "pancake", "donut", "spaghetti", "hotdog",
        "sandwich", "cookie", "popcorn", "chocolate", "banana", "apple", "watermelon", "pineapple",
        "cheese", "croissant", "muffin", "waffle", "steak", "avocado", "broccoli", "french fries"
    ],
    objects: [
        "guitar", "bicycle", "umbrella", "telescope", "clock", "camera", "backpack", "compass",
        "hourglass", "flashlight", "candle", "balloon", "scissors", "magnet", "key", "lightbulb",
        "microscope", "anchor", "sword", "shield", "treasure", "mirror", "sunglasses", "ladder"
    ],
    tech: [
        "robot", "computer", "astronaut", "satellite", "rocket", "smartphone", "headphone", "drone",
        "joystick", "keyboard", "battery", "printer", "submarine", "spaceship", "ufo", "vr headset"
    ],
    actions: [
        "dancing", "swimming", "flying", "sleeping", "cooking", "skateboarding", "singing", "fishing",
        "painting", "reading", "running", "climbing", "surfing", "juggling", "laughing", "sneezing"
    ],
    places: [
        "castle", "pyramid", "volcano", "island", "lighthouse", "waterfall", "beach", "igloo",
        "desert", "windmill", "bridge", "stadium", "circus", "temple", "mountain", "forest"
    ]
};

// Flattened list of all words
const ALL_WORDS = Object.values(WORD_BANK).flat();

module.exports = {
    WORD_BANK,
    ALL_WORDS
};
