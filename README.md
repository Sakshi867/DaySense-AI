# DaySense Flow

**AI-Powered Energy-Aware Productivity App**

DaySense Flow is a productivity application that helps users plan and complete tasks based on their **current energy levels** rather than fixed schedules. It combines **energy tracking, task management, and AI-generated insights** to reduce burnout and improve focus.

---

## Problem

Traditional productivity tools assume constant energy, leading to overload, burnout, and poor focus. They lack personalization and meaningful daily reflection.

---

## Solution

DaySense Flow introduces an **energy-aware productivity system** where:

* Users track energy on a 1–5 scale
* Tasks are planned based on energy cost
* UI adapts to energy state
* AI provides daily insights and reflections

---

## MVP Features

* **Energy Management:** 1–5 energy scale, Recharge / Flow / Focus states, Bio-Orb visualization
* **Task Management:** Priority-based tasks with energy cost and completion tracking
* **AI Insights:** AI coach, daily reflections, flow score analysis
* **Analytics:** Energy trends and task completion insights
* **Customization:** Light/Dark mode, themes, accessibility options

---

## Architecture

```
React (Frontend)
   ↓
Context & State Management
   ↓
Firebase (Auth + Database)
   ↓
Groq AI (Insights)
```

---

## Tech Stack

* React 18, TypeScript, Vite
* Tailwind CSS, Radix UI, shadcn/ui, Framer Motion
* Firebase
* Groq AI Backend

---

## Innovation

* Productivity driven by **human energy**, not just tasks
* Adaptive UI based on energy state
* AI-powered behavioral insights

---

## Future Scope

* Predictive energy modeling
* Mobile app version
* Advanced AI planning features

---

