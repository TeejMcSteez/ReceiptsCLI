const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config();

const supabase = createClient(
    process.env.SUPABASE_URL, process.env.SUPABASE_KEY
);

async function seed() {
    // Example agencies
    const { data: doj } = await supabase.from('agencies').insert([{name: "Department of Justice", slug: 'doj'}]).select();
    const { data: fbi } = await supabase.from('agencies').insert([{name: "Federal Bureau of Investigatiopn", slug: "fbi"}]).select();

    // Example tag
    const { data: traffickingTag } = await supabase.from('tags').insert([{ name: 'Sex Trafficking', slug: 'sex-trafficking' }]).select();

    // Example case
    const { data: case1 } = await supabase.from('cases').insert([{
        title: 'Epstein Non-Prosecution Agreement (2008)',
        summary: 'In 2008, Epstein pled guilty to soliciting a minor in a controversial deal.',
        opinion: 'N/a'
    }]).select();

    // Link Agencies and Tags
    await supabase.from('case_agencies').insert([{ case_id: case1[0].id, agency_id: doj[0].id }]);
    await supabase.from('case_tags').insert([{ case_id: case1[0].id, tag_id: traffickingTag[0].id }]);

    // Add Quotes
    await supabase.from('quotes').insert([{
        case_id: case1[0].id,
        text: "Insert Quote",
        source_link: 'https://source.com'
    }]);

    console.log('Seeding Done.');
}

seed().catch(console.error);