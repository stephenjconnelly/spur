import { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { FaRegClock } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import { format } from 'date-fns';
import Navbar from "@/components/Navbar"

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
  const [showInfoModal, setShowInfoModal] = useState(false); // New modal state
  const [selectedDays, setSelectedDays] = useState(['Mon']);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTestSuite, setSelectedTestSuite] = useState("Demo Suite");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // State to store the selected event


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
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event); // Set the selected event when clicked
    setShowInfoModal(true); // Open the modal to show event details
  };

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
    <div className='flex-row'>
        <Navbar/>
            <div className="p-10 bg-white ">
                <div className="font-semibold text-4xl mb-5">Schedule Suites</div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 ">
                        <Button 
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => setShowModal(true)}
                        >
                            + Schedule Test
                        </Button>
                        <div className="flex items-center gap-3  border border-gray-300 rounded-lg">
                            <Button 
                            variant="ghost" 
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
                            variant="ghost" 
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

                    <div className=" rounded-lg bg-white">
                        
                <div className="flex">

                    <div className="flex flex-col items-center p-2">
                    <div className="text-sm text-gray-600 mt-7 mb-2">PST</div>
                    {HOURS.map((hour) => (
                        <div key={hour} className="h-12 flex items-center text-sm text-gray-600">
                        {hour === 0 ? '1 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                    ))}
                    </div>

                    <div className="flex-1 border rounded-lg">
                    <div className="grid grid-cols-7   bg-neutral-100 ">
                        {DAYS.map((day) => {
                        const date = new Date(weekStart);
                        date.setDate(weekStart.getDate() + DAYS.indexOf(day));
                        return (
                            <div key={day} className="p-2 border-r flex items-center ">
                            <span className="font-medium pr-2">{date.getDate()}</span>
                            <span className="text-sm text-gray-500">{day}</span>
                            </div>
                        );
                        })}
                    </div>

                    <div className="grid grid-cols-7 divide-x divide-gray-200">
                        {DAYS.map((day) => (
                        <div key={day} className="relative">
                            {HOURS.map((hour, index) => (
                            <div
                                key={index}
                                className={`h-12 border-t ${
                                index === HOURS.length - 1 ? 'border-b' : ''
                                } border-gray-200`}
                            ></div>
                            ))}
                            {schedules?.map((event) => (
                            event.days_of_week.includes(day) && (
                                <div
                                key={event.id}
                                className="absolute bg-blue-100 rounded p-2 text-sm text-blue-600 left-0 right-0 mx-1 border border-blue-600"
                                style={{
                                    top: `${new Date(event.start_time).getHours() * 48}px`,
                                }}
                                onClick={() => handleEventClick(event)}
                                >
                                {event.test_suite_name}
                                <div className="flex items-center text-xs mt-1">
                                    <FaRegClock className="mr-1" />
                                    <span>
                                    {new Date(event.start_time).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                    })} PST
                                    </span>
                                </div>
                                </div>
                            )
                            ))}
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
            </div>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-[600px]">
                    <DialogTitle className="text-xl font-semibold">Schedule Detail</DialogTitle>
                    <div className="pt-4">
                        <div className="mb-4">
                        <label className="text-sm font-medium ">Test Suite</label>
                        <select 
                            className="w-full border rounded-md bg-white p-2 appearance-none "
                            value={selectedTestSuite}
                            onChange={(e) => setSelectedTestSuite(e.target.value)}
                        >
                            <option className = "bg-white">Demo Suite</option>
                            <option className = "bg-white" >Administration</option>
                        </select>
                            
                        </div>
                        <div className="border pl-3 pr-3 bg-neutral-50 rounded-lg">
                        <div className="mt-2 mb-2">
                        <label className="text-sm font-medium">Start Date and Time</label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded-md p-2"
                            value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        />
                        </div>

                        <div className="">
                        <label className="text-sm font-medium">Run Weekly on Every</label>
                        <div className="mb-2 mt-1 gap-2 flex ">
                            {DAYS.map((day) => (
                            <Button
                                key={day}
                                variant={selectedDays.includes(day) ? "default" : "outline"}
                                className={`w-12 ${selectedDays.includes(day) ? 'bg-blue-600' : ''} w-full`}
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
                    </div>

                    <div className="flex justify-evenly pt-4 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowModal(false)}
                            className="text-red-600 border-gray-300 w-full"
                            disabled={isSubmitting}
                        >
                            Cancel Schedule
                        </Button>
                    <Button 
                        onClick={handleSaveChanges}
                        className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    </div>
                </div>
                </DialogContent>
            </Dialog>
            {selectedEvent && (
            <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogTitle className="text-lg font-semibold">Event Information</DialogTitle>
                    <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Test Suite</label>
                        <div className="p-2 bg-gray-100 rounded-md">{selectedEvent.test_suite_name}</div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Time</label>
                        <div className="p-2 bg-gray-100 rounded-md">
                        {new Date(selectedEvent.start_time).toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Days of the Week</label>
                        <div className="p-2 bg-gray-100 rounded-md">
                        {selectedEvent.days_of_week.join(', ')}
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button 
                        variant="outline" 
                        onClick={() => setShowInfoModal(false)}
                        className="text-red-600 border-red-600"
                        >
                        Close
                        </Button>
                    </div>
                    </div>
                </DialogContent>
            </Dialog>
            )}
        </div>
    </div>
  );
}