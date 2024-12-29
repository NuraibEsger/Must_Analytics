export const generateRandomHexColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, "0")}`;
};

export const neonColors = [
  { name: "Neon Pink", hex: "#FF6EC7" },
  { name: "Neon Green", hex: "#39FF14" },
  { name: "Neon Blue", hex: "#1B03A3" },
  { name: "Neon Yellow", hex: "#FFFF33" },
  { name: "Neon Orange", hex: "#FF6700" },
  { name: "Neon Purple", hex: "#B026FF" },
];