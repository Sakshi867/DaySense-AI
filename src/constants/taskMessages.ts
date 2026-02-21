export const START_MESSAGES = [
    "Let's dive in! Your focus is your superpower today. 🚀",
    "Time to make progress. You've got this! ✨",
    "Deep work mode: activated. Let's go! 🧠",
    "Starting is the hardest part. Now you're in the flow! 🔥",
    "One step at a time, one task at a time. Purposeful progress. 🎯",
    "Your future self will thank you for starting this now. ⏳",
    "Energy matched. Focus locked. Let's create something great! 💎",
    "Ready to conquer this? The clock is your ally! ⚔️",
    "Small wins lead to big victories. Let's get this one. 🏆",
    "Breathe in, focus, and let's get to work. 🧘‍♂️"
];

export const COMPLETE_MESSAGES = [
    "Mission accomplished! Take a moment to celebrate. 🎉",
    "Task done! Your productivity is through the roof. 📈",
    "Check that off! You're on fire today. 🔥",
    "That's how it's done. Great job! 👏",
    "Boom! Another win for the books. 🎇"
];

export const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
};
