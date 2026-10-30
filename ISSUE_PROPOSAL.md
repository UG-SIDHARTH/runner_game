# GitHub Issue Proposals

This file contains registered GitHub Issue proposals for the **Commit Overflow / FOSS Club** events on `FOSSCLUB-LBSITW/runner_game`.

---

## Active Issue #16: Greedy Helper Robot Companion

- **Issue Link**: [FOSSCLUB-LBSITW/runner_game#16](https://github.com/FOSSCLUB-LBSITW/runner_game/issues/16)
- **Title**: `[Feature]: Add Greedy Helper Robot companion that charges 2 gold coins for assistance`
- **Labels**: `feature`, `needs triage`

### Feature Description
Add a quirky, interactive mini robot assistant character ("GreedBot" / "Helper Robot") to the game.

The robot offers the player assistive perks during gameplay (such as a temporary shield from obstacles, a coin magnet, or a high-jump boost), but strictly demands a fee of **2 gold coins**.
- **If the player has at least 2 coins and chooses to pay:** The robot accepts the coins, deducts 2 from the coin counter, and activates a short assistance power-up (e.g. invulnerability shield or obstacle clearing).
- **If the player has fewer than 2 coins or refuses:** The robot refuses to help (*"2 gold coins or you get nothing!"*), plays a metallic buzz / rejected chime, and leaves the player to fend for themselves without any perks.

### Proposed Implementation
1. **Robot Visual Asset & Animation:**
   - Create an 8-bit retro pixel-art SVG robot sprite (with blinking LED eyes and hovering thruster animation) in the UI or game viewport.
2. **Payment & Perk Logic (`script.js`):**
   - Track robot appearance intervals or summon trigger during a run.
   - When triggered, prompt the player: checks `coinsCollected >= 2`.
   - If paid: deduct 2 coins (`coinsCollected -= 2`), update HUD coins counter, and grant temporary invincibility/shield duration (e.g., 5 seconds).
   - If not paid / insufficient coins: reject assistance with a witty dialogue notification: *"BZZT! No coins, no help! You get nothing!"*
3. **Sound & Mascot Interaction:**
   - Add retro 8-bit synthesizer bleeps/boops via the Web Audio API for robot interactions.
   - Connect with the existing Roast Horse mascot to trigger comedic commentary when the player either bribes the robot or gets rejected for being broke.
4. **Responsive Styling (`style.css`):**
   - Add retro neon cyber styling and HUD button/prompt matching Dark and White mode palettes.

### Additional Context
- Adds strategic depth and a risk-reward economy to coin collecting, making coins useful instead of just decorative.
- Fits the retro arcade neon aesthetic and pairs humorously with the Roast Horse companion.

### Checklist
- [x] I confirm that I want to work on this feature.
- [x] I have searched the existing issues for similar feature requests.
- [x] I have read the `CONTRIBUTING.md` guidelines.

---

## Completed Issue #13: Progressive Web App (PWA)
- **Issue Link**: [FOSSCLUB-LBSITW/runner_game#13](https://github.com/FOSSCLUB-LBSITW/runner_game/issues/13)
- **Pull Request**: [FOSSCLUB-LBSITW/runner_game#15](https://github.com/FOSSCLUB-LBSITW/runner_game/pull/15)
