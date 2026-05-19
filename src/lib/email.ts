import emailjs from "@emailjs/browser";

export async function sendSessionsWarning(student: any) {
  try {
    const result = await emailjs.send(
      "service_xx1z2e6",
      "template_dpl4xjd",
      {
        parent_email: student.parent_email,
        student_name: student.name,
        remaining_sessions: student.remaining_sessions,
      },
      "0PKpX2Dai4TTm1ajv"
    );

    console.log("EMAIL SENT", result.text);
  } catch (err) {
    console.error("EMAIL ERROR", err);
  }
}
