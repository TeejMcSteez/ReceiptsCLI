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

            if (newStatus === 'approved') {
                const { error: updateError } = await supabase
                    .from('submissions')
                    .update({ status: newStatus })
                    .eq('id', submission.id);
                if (updateError) {
                    console.error(`Failed to update status for ID ${submission.id}:`, updateError);
                } else {
                    console.log(`Status updated to 'approved' for ID ${submission.id}`);
                }
                askAndUpdate(index + 1);
            } else if (newStatus === 'rejected') {
                rl.question('Enter reason for rejection: ', async (reason) => {
                    // Update status to rejected
                    const { error: updateError } = await supabase
                        .from('submissions')
                        .update({ status: 'rejected' })
                        .eq('id', submission.id);
                    if (updateError) {
                        console.error(`Failed to update status for ID ${submission.id}:`, updateError);
                        askAndUpdate(index + 1);
                        return;
                    }
                    // Insert into rejected_submissions
                    const { error: insertError } = await supabase
                        .from('rejected_submissions')
                        .insert({ id: submission.id, reason });
                    if (insertError) {
                        console.error(`Failed to insert into rejected_submissions for ID ${submission.id}:`, insertError);
                    } else {
                        console.log(`Submission ${submission.id} rejected and logged with reason.`);
                    }
                    askAndUpdate(index + 1);
                });
            } else {
                console.log(`Left as pending for ID ${submission.id}`);
                askAndUpdate(index + 1);
            }
        });
    }

    askAndUpdate(0);
}

reviewSubmissions();