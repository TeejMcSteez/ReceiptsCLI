const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config();

const supabase = createClient(
    process.env.SUPABASE_URL, process.env.SUPABASE_KEY
);

const readline = require('readline');

async function reviewSubmissions() {
    const { data, error } = await supabase
        .from("submissions")
        .select("id, title, summary, quotes, tags, sources, opinion, submitted_by, status, created_at")
        .eq("status", "pending");

    if (error) {
        console.error("Error fetching submissions:", error);
        return;
    }
    if (!data || data.length === 0) {
        console.log("No pending submissions.");
        return;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    async function askAndUpdate(index) {
        if (index >= data.length) {
            rl.close();
            console.log("Review complete.");
            return;
        }
        const submission = data[index];
        console.log(`\nSubmission #${index + 1}`);
        console.log(`ID: ${submission.id}`);
        console.log(`Title: ${submission.title}`);
        console.log(`Summary: ${submission.summary}`);
        console.log(`Sources: ${submission.sources}`);

        rl.question('Approve (a), Deny (d), or Pending (p)? ', async (answer) => {
            let newStatus;
            if (answer.toLowerCase() === 'a') newStatus = 'approved';
            else if (answer.toLowerCase() === 'd') newStatus = 'rejected';
            else newStatus = 'pending';

            if (newStatus !== 'pending') {
                const { error: updateError } = await supabase
                    .from('submissions')
                    .update({ status: newStatus })
                    .eq('id', submission.id);
                if (updateError) {
                    console.error(`Failed to update status for ID ${submission.id}:`, updateError);
                } else {
                    console.log(`Status updated to '${newStatus}' for ID ${submission.id}`);
                }
            } else {
                console.log(`Left as pending for ID ${submission.id}`);
            }
            askAndUpdate(index + 1);
        });
    }

    askAndUpdate(0);
}

reviewSubmissions();