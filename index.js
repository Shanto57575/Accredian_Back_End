import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(cors({
    origin: ['http://localhost:5173', 'https://accredian-front-end.vercel.app/']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({ message: "Accredian API IS WORKING FINE!" });
});

app.post('/api/referral', async (req, res) => {
    const { yourName, yourEmail, friendName, friendEmail, recommendedCourse } = req.body;

    if (!yourName || !yourEmail || !friendName || !friendEmail || !recommendedCourse) {
        return res.status(400).send({ error: "All fields are required" });
    }

    try {
        const referral = await prisma.referral.create({
            data: { referrer: yourName, referee: friendName, email: friendEmail }
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: friendEmail,
            subject: 'Learn & Earn: You Have Been Referred',
            text: `Hi ${friendName}, \n\n${yourName} has referred you to our course.\n\nBest regards, \nAccredian\n\nCheck out the courses: https://accredian.com/`,
            html: `
                <p>Hi ${friendName},</p>
                <p>${yourName} has referred you to our course.</p>
                <p>Recommended Course: ${recommendedCourse}</p>
                <p>Best regards,<br>Accredian</p>
                <p><a href="https://accredian.com/">Check out the courses</a></p>
            `,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email Sent: ${info.response}`);
            res.status(201).send({
                message: "Referral created and email sent successfully",
                referral
            });
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            res.status(201).json({
                message: "Referral created but failed to send email",
                referral,
                emailError: emailError.message
            });
        }
    } catch (error) {
        console.error("Error processing referral:", error);
        res.status(500).send({ error: "Sorry, Something Went Wrong!" });
    }
});

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
