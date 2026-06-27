import { supabase } from '../supabaseClient'; // Adjust this path if your client is somewhere else!

/**
 * Logs an action to the system_logs table in Supabase.
 * * @param {string} actionType - A short category (e.g., 'SUBMIT_REPORT', 'UPDATE_REPORT', 'LOGIN')
 * @param {string} actionDetails - A detailed description of what exactly happened
 */
export const logSystemAction = async (actionType, actionDetails) => {
  try {
    // 1. Get the currently logged-in user directly from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn("Logger: No active user found. Cannot log action.");
      return;
    }

    // 2. Insert the log into the database
    const { error: insertError } = await supabase
      .from('system_logs')
      .insert([
        {
          user_id: user.id, // This matches the UUID in your database
          action_type: actionType,
          action_details: actionDetails,
        }
      ]);

    if (insertError) {
      console.error("Logger Failed to insert:", insertError.message);
    } else {
      console.log(`System Logged: [${actionType}]`); // Helpful to see in your browser console
    }

  } catch (err) {
    console.error("Logger Error:", err);
  }
};