import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../utils/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET": {
      const { data, error } = await supabase.from("schedules").select("*");
      if (error) return res.status(400).json({ error });
      return res.status(200).json(data);
    }
    case "POST": {
      const { test_suite_name, start_time, days_of_week } = req.body;
      const { data, error } = await supabase.from("schedules").insert([
        { test_suite_name, start_time, days_of_week },
      ]);
      if (error) return res.status(400).json({ error });
      return res.status(201).json(data);
    }
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}