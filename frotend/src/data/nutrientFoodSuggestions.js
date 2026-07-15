// Static food/diet suggestions per tracked nutrient, shown on "Know more" in
// the Dashboard's deficiency alerts widget. Deliberately static (no Gemini
// call) — keeps the widget instant and free to show.
export const NUTRIENT_FOOD_SUGGESTIONS = {
  protein: 'chicken breast, eggs, Greek yogurt, lentils, tofu',
  fiber: 'beans, oats, whole grains, berries, broccoli',
  iron: 'spinach, red meat, lentils, fortified cereals, pumpkin seeds',
  calcium: 'dairy products, fortified plant milk, tofu, leafy greens, almonds',
  vitaminD: 'fatty fish like salmon, fortified milk, egg yolks, mushrooms',
  vitaminC: 'citrus fruits, bell peppers, strawberries, broccoli, kiwi',
  potassium: 'bananas, potatoes, spinach, beans, avocado',
};
