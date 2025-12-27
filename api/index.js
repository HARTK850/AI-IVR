const { GoogleGenerativeAI } = require("@google/generative-ai");

// קבלת מפתח ה-API משתני הסביבה (נגדיר זאת ב-Vercel)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  // ימות המשיח שולחים נתונים ב-GET או POST. נתמוך בשניהם.
  const query = req.method === 'POST' ? req.body : req.query;

  // הפרמטר שמכיל את הטקסט שהמשתמש אמר. 
  // בימות המשיח, כשמשתמשים בזיהוי דיבור, הטקסט מגיע בדרך כלל בפרמטר שמוגדר (למשל ApiAnswer)
  // נניח שאנחנו מקבלים את הטקסט בפרמטר בשם 'text' או 'ApiAnswer'
  let userText = query.text || query.ApiAnswer;

  // אם אין טקסט (כניסה ראשונה לשלוחה), נבקש מהמשתמש לדבר
  if (!userText) {
    // הפקודה read=t-משהו משמיעה טקסט (TTS).
    // הפקודה הזו מבקשת קלט מסוג זיהוי דיבור (אם המודול תומך) או הקלטה.
    // לצורך הפשטות, נחזיר הודעת פתיחה וניתן למערכת ימות המשיח לטפל בקליטה (הסבר בהמשך בהגדרות השלוחה).
    return res.status(200).send('read=t-שלום, אני גמיני. על מה תרצו לדבר איתי היום?=val_name,yes,t,no'); 
  }

  try {
    // אתחול המודל
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // שליחת הטקסט ל-Gemini
    const result = await model.generateContent(userText);
    const response = await result.response;
    let textResponse = response.text();

    // ניקוי הטקסט מתווים שיכולים לשבש את ימות המשיח (כמו מקפים כפולים או תווים מיוחדים מדי)
    textResponse = textResponse.replace(/=/g, '-').replace(/&/g, 'ו');

    // שליחת התשובה חזרה לימות המשיח להקראה
    // אנו משמיעים את התשובה ומבקשים קלט חדש מיד אחריה כדי להמשיך את השיחה
    return res.status(200).send(`read=t-${textResponse}=val_name,yes,t,no`);

  } catch (error) {
    console.error("Error talking to Gemini:", error);
    return res.status(200).send('read=t-אירעה שגיאה בתקשורת עם הבינה המלאכותית. אנא נסו שנית.');
  }
}
