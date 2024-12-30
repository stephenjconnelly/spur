import { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import { format } from 'date-fns';

interface Event {
  id: number;
  test_suite_name: string;
  start_time: string;
  days_of_week: string[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(['Mon']);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTestSuite, setSelectedTestSuite] = useState("Demo Suite");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const { data: schedules } = useQuery<Event[]>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*");
      if (error) throw error;
      return data || [];
    }
  });

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("schedules").insert([{
        test_suite_name: selectedTestSuite,
        start_time: selectedDate.toISOString(),
        days_of_week: selectedDays
      }]);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowModal(false);
      
      // Reset form
      setSelectedDays(['Mon']);
      setSelectedDate(new Date());
      setSelectedTestSuite("Demo Suite");
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            + Schedule Test
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              Week of {weekStart.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 border-r text-sm text-gray-500">PST</div>
          {DAYS.map((day) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + DAYS.indexOf(day));
            return (
              <div key={day} className="p-2 text-center border-r">
                <div className="text-sm text-gray-500">{day}</div>
                <div>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-8">
          <div className="border-r">
            {HOURS.map((hour) => (
              <div key={hour} className="h-12 border-b p-2 text-sm text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {DAYS.map((day) => (
            <div key={day} className="border-r relative">
              {HOURS.map((hour) => (
                <div key={hour} className="h-12 border-b"></div>
              ))}
              {schedules?.map((event) => (
                event.days_of_week.includes(day) && (
                  <div
                    key={event.id}
                    className="absolute bg-blue-100 rounded p-2 text-sm left-0 right-0 mx-1"
                    style={{
                      top: `${new Date(event.start_time).getHours() * 48}px`,
                    }}
                  >
                    {event.test_suite_name}
                  </div>
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold">Schedule Detail</DialogTitle>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Suite</label>
              <select 
                className="w-full border rounded-md p-2"
                value={selectedTestSuite}
                onChange={(e) => setSelectedTestSuite(e.target.value)}
              >
                <option>Demo Suite</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date and Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded-md p-2"
                value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Run Weekly on Every</label>
              <div className="flex gap-2">
                {DAYS.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    className={`w-12 ${selectedDays.includes(day) ? 'bg-blue-600' : ''}`}
                    onClick={() => {
                      setSelectedDays(
                        selectedDays.includes(day)
                          ? selectedDays.filter(d => d !== day)
                          : [...selectedDays, day]
                      );
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="text-red-600 border-red-600"
                disabled={isSubmitting}
              >
                Cancel Schedule
              </Button>
              <Button 
                onClick={handleSaveChanges}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}