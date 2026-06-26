export interface MarketRate {
  id: string;
  nameEn: string;
  nameHi: string;
  nameTa: string;
  pricePerKg: number;
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage change
}

export const marketRates: MarketRate[] = [
  { id: '1', nameEn: 'Tomato', nameHi: 'टमाटर', nameTa: 'தக்காளி', pricePerKg: 30, trend: 'down', change: 5 },
  { id: '2', nameEn: 'Onion', nameHi: 'प्याज', nameTa: 'வெங்காயம்', pricePerKg: 45, trend: 'up', change: 12 },
  { id: '3', nameEn: 'Potato', nameHi: 'आलू', nameTa: 'உருளைக்கிழங்கு', pricePerKg: 25, trend: 'stable', change: 0 },
  { id: '4', nameEn: 'Rice (Ponni)', nameHi: 'चावल (पोन्नी)', nameTa: 'பொன்னி அரிசி', pricePerKg: 60, trend: 'up', change: 2 },
  { id: '5', nameEn: 'Wheat', nameHi: 'गेहूं', nameTa: 'கோதுமை', pricePerKg: 40, trend: 'stable', change: 1 },
  { id: '6', nameEn: 'Green Chilli', nameHi: 'हरी मिर्च', nameTa: 'பச்சை மிளகாய்', pricePerKg: 50, trend: 'down', change: 10 },
  { id: '7', nameEn: 'Carrot', nameHi: 'गाजर', nameTa: 'கேரட்', pricePerKg: 40, trend: 'up', change: 5 },
  { id: '8', nameEn: 'Cabbage', nameHi: 'पत्ता गोभी', nameTa: 'முட்டைக்கோஸ்', pricePerKg: 20, trend: 'stable', change: 0 },
  { id: '9', nameEn: 'Cauliflower', nameHi: 'फूल गोभी', nameTa: 'காலிபிளவர்', pricePerKg: 35, trend: 'down', change: 8 },
  { id: '10', nameEn: 'Brinjal', nameHi: 'बैंगन', nameTa: 'கத்தரிக்காய்', pricePerKg: 30, trend: 'stable', change: 2 },
  { id: '11', nameEn: 'Ladies Finger', nameHi: 'भिंडी', nameTa: 'வெண்டைக்காய்', pricePerKg: 40, trend: 'up', change: 6 },
  { id: '12', nameEn: 'Garlic', nameHi: 'लहसुन', nameTa: 'பூண்டு', pricePerKg: 150, trend: 'up', change: 15 },
  { id: '13', nameEn: 'Ginger', nameHi: 'अदरक', nameTa: 'இஞ்சி', pricePerKg: 120, trend: 'stable', change: 0 },
  { id: '14', nameEn: 'Coriander Leaves', nameHi: 'धनिया पत्ती', nameTa: 'கொத்தமல்லி', pricePerKg: 10, trend: 'down', change: 20 },
  { id: '15', nameEn: 'Mint Leaves', nameHi: 'पुदीना', nameTa: 'புதினா', pricePerKg: 12, trend: 'down', change: 15 },
  { id: '16', nameEn: 'Coconut', nameHi: 'नारियल', nameTa: 'தேங்காய்', pricePerKg: 25, trend: 'stable', change: 0 },
  { id: '17', nameEn: 'Banana', nameHi: 'केला', nameTa: 'வாழைப்பழம்', pricePerKg: 40, trend: 'up', change: 4 },
  { id: '18', nameEn: 'Mango', nameHi: 'आम', nameTa: 'மாம்பழம்', pricePerKg: 80, trend: 'up', change: 10 },
  { id: '19', nameEn: 'Apple', nameHi: 'सेब', nameTa: 'ஆப்பிள்', pricePerKg: 150, trend: 'stable', change: 1 },
  { id: '20', nameEn: 'Papaya', nameHi: 'पपीता', nameTa: 'பப்பாளி', pricePerKg: 30, trend: 'down', change: 5 },
  { id: '21', nameEn: 'Watermelon', nameHi: 'तरबूज', nameTa: 'தர்பூசணி', pricePerKg: 20, trend: 'down', change: 10 },
  { id: '22', nameEn: 'Sugarcane', nameHi: 'गन्ना', nameTa: 'கரும்பு', pricePerKg: 15, trend: 'stable', change: 0 },
  { id: '23', nameEn: 'Groundnut', nameHi: 'मूंगफली', nameTa: 'நிலக்கடலை', pricePerKg: 90, trend: 'up', change: 8 },
  { id: '24', nameEn: 'Cotton', nameHi: 'कपास', nameTa: 'பருத்தி', pricePerKg: 120, trend: 'down', change: 3 },
  { id: '25', nameEn: 'Mustard Seeds', nameHi: 'सरसों', nameTa: 'கடுகு', pricePerKg: 70, trend: 'stable', change: 1 },
  { id: '26', nameEn: 'Turmeric', nameHi: 'हल्दी', nameTa: 'மஞ்சள்', pricePerKg: 110, trend: 'up', change: 7 },
  { id: '27', nameEn: 'Black Pepper', nameHi: 'काली मिर्च', nameTa: 'மிளகு', pricePerKg: 500, trend: 'up', change: 5 },
];
