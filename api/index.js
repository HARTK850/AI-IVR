const { GoogleGenerativeAI } = require("@google/generative-ai");

// הגדרת המפתח והמודל (מעודכן ל-2.0-flash כמו בקוד שלך)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    // הגדרת Header לעברית
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const query = req.method === 'POST' ? req.body : req.query;

    // מקבל את הפרמטר 'txt' כפי שמוגדר בקוד ה-PHP וב-read
    let userText = query.txt;

    try {
        // שלב א: אם אין טקסט (כניסה ראשונה) - בקשת הקלדה
        if (!userText || userText.trim().length < 2) {
            // הקלטה/הקראה + המתנה להקלדה במקלדת עברית (HebrewKeyboard)
            return res.status(200).send("read=t-אנא הקלד שאלה מלאה במקלדת האותיות וסיים בסולמית.=txt,,,,,HebrewKeyboard,");
        }

        // שלב ב: שליחה לבינה המלאכותית
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userText);
        const response = await result.response;
        let textResponse = response.text();

        // שלב ג: עיבוד הטקסט (ניקוי תווים אסורים והוספת פסיקים כל 10 מילים כמו ב-PHP)
        // ניקוי תווים מיוחדים
        let cleanText = textResponse.replace(/[^A-Za-z0-9א-ת\s]/g, '');
        
        // הוספת פסיק כל 10 מילים לשיפור ההקראה
        let words = cleanText.split(/\s+/);
        let chunks = [];
        for (let i = 0; i < words.length; i += 10) {
            chunks.push(words.slice(i, i + 10).join(' ') + ',');
        }
        let finalOutput = chunks.join(' ');

        // שלב ד: החזרת התשובה והמתנה לשאלה הבאה (כדי שלא יתנתק!)
        // אנחנו משתמשים שוב ב-read כדי שהמשתמש יוכל לשאול עוד שאלה מיד
        return res.status(200).send(`read=t-${finalOutput}. לשאלה נוספת הקלידו כעת וסיימו בסולמית.=txt,,,,,HebrewKeyboard,`);

    } catch (error) {
        console.error("Error:", error);
        return res.status(200).send("read=t-אירעה שגיאה בשרת. נסו שוב.=txt,,,,,HebrewKeyboard,");
    }
};
