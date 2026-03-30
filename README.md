<div align="center">
  <img src="icons/icon128.png" alt="Page Chaos Logo" width="128">
  <h1>💀 PAGE CHAOS</h1>
  <p><b>One click and the webpage you're on physically breaks apart.</b></p>
  
  ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
  ![Chrome](https://img.shields.io/badge/chrome%20extension-%234285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)
  ![Matter.js](https://img.shields.io/badge/Matter.js-Physics-purple?style=for-the-badge)
</div>

---

## 🌪️ What is Page Chaos?

PageChaos is a Manifest V3 Chrome extension that transforms the static DOM into a chaotic, interactive Matter.js physics simulation. Featuring a clean, manga-inspired UI, it allows you to unleash five different forces of destruction on any webpage.

<div align="center">
  <video width="800" autoplay loop muted playsinline>
    <source src="YOUR_VIDEO_URL_HERE.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>
## ✨ Arsenal of Destruction

| Mode | Description |
| :--- | :--- |
| ☄️ **Meteor Strike** | Elements are struck one by one with heavy downward force, causing screen shake. |
| 🌀 **Black Hole** | A dark void appears. Move your mouse to drag elements into the singularity. |
| 💥 **Explosion** | An instant, full-page outward detonation from the center of your screen. |
| 🌊 **Wave** | A cascading physical force sweeps across the DOM from left to right. |
| ⬇️ **Gravity** | Pure, simple vertical gravity. Everything drops into the abyss. |

## 🚀 Installation

This extension is currently loaded locally. Follow these steps to unleash the chaos:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/pagechaos.git](https://github.com/yourusername/pagechaos.git)
Open Google Chrome and navigate to chrome://extensions/.

Toggle Developer mode ON (top right corner).

Click Load unpacked and select the PageChaos directory.

Pin the skull 💀 to your toolbar.

🛠️ Technical Architecture
DOM Flattening: Recursively bypasses Shadow DOM to target rendering nodes while excluding complex internal wrappers (like video players).

Physics Engine: Matter.js (v0.19.0) handles rigid body translations and collision boundaries.

Injection: Utilizes Chrome's scripting API to dynamically insert the engine and simulation payload into the active tab's isolated world.

👨‍💻 Author
Divyansh Khandal

GitHub Profile

LinkedIn
