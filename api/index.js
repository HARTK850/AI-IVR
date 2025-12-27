const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
  // חובה: הגדרת כותרת כדי שימות המשיח יבינו את העברית
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const query = req.method === 'POST' ? req.body : req.query;

  // קליטת הטקסט שהוקלד (אנחנו נקרא למשתנה UserText)
  let userText = query.UserText;

  console.log("Input received:", userText);

  try {
    // 1. אם אין טקסט (כניסה ראשונה), נבקש להקליד
    if (!userText) {
      // הסיומת =UserText היא הקריטית! היא אומרת למערכת לחכות לקלט
      return res.status(200).send('read=t-שלום, אני גמיני. אנא הקלידו את שאלתכם וסיימו בסולמית.=UserText'); 
    }

    // 2. אם המשתמש הקליד משהו - שולחים לגוגל
    // הערה: הקלדה בימות המשיח היא בדרך כלל מספרים, אלא אם מוגדרת המרת מקשים לאותיות
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // מוסיפים הנחיה למודל שידע שמדובר בטקסט קצר או מספרים אם זה המצב
    const result = await model.generateContent(userText);
    const response = await result.response;
    
    let textResponse = response.text()
        .replace(/\*/g, '')      // ניקוי כוכביות
        .replace(/=/g, '-')      // החלפת שווה במקף (חובה!)
        .replace(/&/g, 'ו')
        .replace(/\n/g, '. ');

    // 3. מחזירים תשובה ומבקשים את הקלט הבא
    return res.status(200).send(`read=t-${textResponse}=UserText`);

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).send('read=t-אירעה שגיאה, נסו שוב.=UserText');
  }
};
