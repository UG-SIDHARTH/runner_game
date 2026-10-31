# Pull Request Information

- **Pull Request Title**: `feat: add greedy helper robot companion charging 2 coins for shield assistance`
- **Base Repository**: `FOSSCLUB-LBSITW/runner_game:main`
- **Head Branch**: `UG-SIDHARTH:feature/16-greedy-helper-robot`
- **Linked Issue**: Closes #16

---

### PR Summary:
- Added quirky interactive mini robot companion ("GreedBot") with pixel-art SVG sprite, blinking LED eyes, and hovering thruster animations.
- Implemented coin economy perk: GreedBot strictly demands a fee of 2 gold coins to grant a temporary 5-second invincibility shield against obstacles.
- If player has < 2 coins or refuses: GreedBot rejects with witty robotic banter and a metallic buzz sound.
- Added retro 8-bit synthesizer bleeps/boops via Web Audio API.
- Integrated comedic commentary hooks with the Roast Horse mascot for bribery, broke rejections, shield rescues, and refusal events.
- Styled responsive HUD button and hovering cyber dialogue box matching both Dark and White mode palettes.
- Bumper service worker cache version to `neon-runner-v2`.

