const API_URL = "https://api-inference.huggingface.co/models/deep-learning-fr/gfpgan-v1.3";
// تم حذف رمز Hugging Face لتجنب المشاكل الأمنية. لا تقم بحفظ الرموز السرية في الكود مباشرة.
const HF_TOKEN = "";

export const enhanceWithHuggingFace = async (imageFile: File): Promise<string> => {
  if (!HF_TOKEN) {
    throw new Error("رمز Hugging Face API غير موجود. تم تعطيل هذه الميزة لأسباب أمنية.");
  }
    
  try {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${HF_TOKEN}` },
      method: "POST",
      body: imageFile,
    });

    if (!response.ok) {
        // Handle model loading specifically, as it's a common case.
        if (response.status === 503) {
            try {
                const errorBody = await response.json();
                if (errorBody.estimated_time) {
                    throw new Error(`نموذج Hugging Face قيد التحميل حاليًا. الرجاء المحاولة مرة أخرى خلال ${Math.ceil(errorBody.estimated_time)} ثانية تقريبًا.`);
                }
            } catch (e) {
                // Ignore if JSON parsing fails, fall through to generic 503 message.
            }
            throw new Error("نموذج Hugging Face قيد التحميل أو غير متوفر مؤقتًا (503). الرجاء المحاولة مرة أخرى بعد قليل.");
        }

        if (response.status === 404) {
            throw new Error("حدث خطأ من Hugging Face (404): لم يتم العثور على النموذج. قد يكون الرابط غير صحيح أو النموذج غير متوفر.");
        }

        // For other errors, try to get details from the body.
        let errorMessage = `حدث خطأ من Hugging Face (الحالة: ${response.status}).`;
        try {
            const errorBody = await response.json();
            if (errorBody.error) {
                errorMessage = `خطأ من Hugging Face: ${errorBody.error}`;
            }
        } catch (e) {
            // Body is not JSON or empty, use the status code message.
        }
        throw new Error(errorMessage);
    }

    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error("Error enhancing image with Hugging Face:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("حدث خطأ غير معروف أثناء الاتصال بـ Hugging Face.");
  }
};