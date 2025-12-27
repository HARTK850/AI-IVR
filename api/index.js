const { GoogleGenerativeAI } = require("@google/generative-ai");

// אתחול Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    // הגדרת כותרת כדי שימות המשיח יבינו את הטקסט
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // שליפת הפרמטר 'txt' מכל סוגי הבקשות (POST וגם GET)
    let userText = "";
    if (req.method === 'POST') {
        userText = req.body.txt || "";
    } else {
        userText = req.query.txt || "";
    }

    try {
        // שלב 1: אם המשתמש עדיין לא הקליד כלום (כניסה ראשונה)
        if (!userText || userText.trim().length < 2) {
            return res.status(200).send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        // שלב 2: שליחה ל-Gemini (שימוש במודל 2.0 פלאש כמו ב-PHP)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userText);
        const response = await result.response;
        const textResponse = response.text();

        // שלב 3: עיבוד הטקסט בדיוק לפי ה-Regex של ה-PHP (רק אותיות, מספרים ורווחים)
        let generatedText = textResponse.replace(/[^A-Za-z0-9א-ת\s]/g, '');
        
        // שלב 4: חלוקה ל-10 מילים והוספת פסיק (להקראה טובה בימות המשיח)
        const words = generatedText.split(/\s+/).filter(w => w.length > 0);
        let chunks = [];
        for (let i = 0; i < words.length; i += 10) {
            chunks.push(words.slice(i, i + 10).join(' ') + ',');
        }
        let finalOutput = chunks.join(' ');

        // שלב 5: התשובה הסופית - קריטי למניעת הניתוק!
        // אנחנו משתמשים ב-id_list_message להשמעה, ומוסיפים read בסוף כדי להחזיר אותו ללופ
        return res.status(200).send(`id_list_message=t-${finalOutput}&read=t-לשאלה נוספת הקלידו כעת=txt,,,,,HebrewKeyboard,`);

    } catch (error) {
        console.error("Gemini Error:", error);
        // במקרה של שגיאה, מחזירים פקודה שמונעת ניתוק ומבקשת לנסות שוב
        return res.status(200).send("read=t-אירעה שגיאה בשרת. אנא נסו להקליד את השאלה שוב.=txt,,,,,HebrewKeyboard,");
    }
};
