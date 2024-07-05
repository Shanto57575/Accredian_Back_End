import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/api/referrals', async (req, res) => {
    try {
        const referrals = await prisma.referral.findMany();
        res.json(referrals);
    } catch (error) {
        console.error('Error retrieving referrals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/referral', async (req, res) => {
    const { referrer, referee, email } = req.body;

    if (!referrer || !referee || !email) {
        return res.status(400).send({ error: "All fields are required" });
    }

    try {
        const referral = await prisma.referral.create({
            data: { referrer, referee, email }
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // Make sure this is an App Password if using Gmail
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Learn & Earn : You Have Been Referred',
            text: `Hi ${referee}, \n\n${referrer} has referred you to our course.\n\nBest regards, \nAccredian`,
        };

        // Use async/await for sending email
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email Sent: ${info.response}`);
            res.status(201).json({
                message: "Referral created and email sent successfully",
                referral
            });
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Still return 201 as the referral was created, but include a message about the email
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
    console.log(`Accredian is listening on PORT : ${PORT}`);
});