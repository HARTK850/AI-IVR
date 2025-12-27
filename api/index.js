const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // שליפת הטקסט מכל מקור אפשרי (POST או GET)
    let userText = "";
    if (req.body && req.body.txt) {
        userText = req.body.txt;
    } else if (req.query && req.query.txt) {
        userText = req.query.txt;
    }

    try {
        // אם אין טקסט (כניסה ראשונה)
        if (!userText || userText.trim().length < 2) {
            return res.status(200).send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        // שליחה ל-Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userText);
        const response = await result.response;
        let textResponse = response.text();

        // עיבוד טקסט בדיוק כמו ב-PHP ששלחת
        let cleanText = textResponse.replace(/[^A-Za-z0-9א-ת\s]/g, '');
        let words = cleanText.split(/\s+/);
        let chunks = [];
        for (let i = 0; i < words.length; i += 10) {
            chunks.push(words.slice(i, i + 10).join(' ') + ',');
        }
        let finalOutput = chunks.join(' ');

        // החזרת התשובה - משתמשים ב-id_list_message כפי שמופיע בסוף קוד ה-PHP שלך
        // אבל מוסיפים בסוף מעבר חזרה לתחילת השלוחה כדי שלא יתנתק בסיום ההקראה
        return res.status(200).send(`id_list_message=t-${finalOutput}&go_to_folder=.` );

    } catch (error) {
        console.error("Error:", error);
        return res.status(200).send("read=t-אירעה שגיאה. נסו שוב.=txt,,,,,HebrewKeyboard,");
    }
};
