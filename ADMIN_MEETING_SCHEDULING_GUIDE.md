# Admin Meeting Scheduling Guide

## How Admins Identify and Schedule Meetings

This guide explains how admins can identify meeting requests from students and schedule meetings with them.

## Step 1: Accessing the Admin Dashboard

1. Log in to the admin portal using credentials:
   - Email: `asthikshetty9999@gmail.com`
   - Password: `123456` (or `Asthik@9901` if changed)

2. Navigate to the "Complaints" section from the bottom navigation bar

## Step 2: Identifying Meeting Requests

### Visual Indicators in Complaint List
Meeting requests are clearly marked in the complaint management screen:

1. **Orange Border**: Meeting requests have an orange left border
2. **MEETING Chip**: A special "MEETING" chip appears next to the status
3. **Topic Prefix**: Topics start with "[MEETING REQUEST]"

```
┌─────────────────────────────────────────────┐
│ 📅 MEETING REQUEST - Student Topic          │
│ [MEETING] [SUBMITTED]                       │
│ Student: John Doe                           │
│ Course: Computer Science                    │
│ Submitted: 2025-10-15                       │
│ └─ Assign to Professor                      │
└─────────────────────────────────────────────┘
```

## Step 3: Viewing Meeting Request Details

1. Tap on any meeting request to view details
2. The complaint details screen will show:
   - A banner indicating this is a meeting request
   - Student information
   - Request details
   - Special "Schedule Meeting with Student" button

### Meeting Request Banner
```
┌─────────────────────────────────────────────┐
│ 📅 MEETING REQUEST                          │
│ This is a meeting request from a student    │
│ who has reached their weekly complaint      │
│ limit.                                      │
└─────────────────────────────────────────────┘
```

## Step 4: Scheduling a Meeting

1. Click the "Schedule Meeting with Student" button
2. Fill out the scheduling form:
   - **Meeting Date**: Enter the date (YYYY-MM-DD format)
   - **Meeting Time**: Enter the time (24-hour format HH:MM)
   - **Meeting Location**: Enter the location (e.g., "Office Hours Room 101")
   - **Additional Notes**: Optional notes for the student

3. Click "Schedule Meeting"

### Scheduling Form Example
```
┌─────────────────────────────────────────────┐
│ Schedule Meeting with Student               │
│                                             │
│ Student: John Doe                           │
│ Email: john.doe@example.com                 │
│ Meeting Request Topic: Additional Support   │
│                                             │
│ [Date Field     ] 2025-12-25                │
│ Please enter date in YYYY-MM-DD format      │
│                                             │
│ [Time Field     ] 14:30                     │
│ Please enter time in 24-hour format         │
│                                             │
│ [Location Field ] Office Hours Room 101     │
│                                             │
│ [Notes Field    ] _________________________ │
│ | Please come prepared with your          | │
│ | questions.                              | │
│ |_________________________________________| │
│                                             │
│ [Schedule Meeting] [Cancel]                 │
└─────────────────────────────────────────────┘
```

## Step 5: Confirmation and Student Notification

1. After scheduling, the system:
   - Adds a structured reply to the complaint thread
   - Automatically notifies the student
   - Updates the complaint status if needed

2. Student receives a modal popup with meeting details:
   - Date and time
   - Location
   - Scheduled by information
   - Option to view full details

### Student Notification Example
```
┌─────────────────────────────────────────────┐
│ Meeting Scheduled!                          │
│                                             │
│ An admin has scheduled a meeting with you.  │
│                                             │
│ Date: 2025-12-25                            │
│ Time: 14:30                                 │
│ Location: Office Hours Room 101             │
│ Scheduled by: Admin User                    │
│                                             │
│ [View Details] [Close]                      │
└─────────────────────────────────────────────┘
```

## Step 6: Managing Scheduled Meetings

1. The scheduled meeting information is stored as a reply in the complaint thread
2. Admins can view all meeting details in the complaint history
3. Students can reference meeting details anytime by viewing the complaint

### Meeting Details in Complaint Thread
```
Admin User (admin) - 2025-10-18 14:30
MEETING SCHEDULED

Date: 2025-12-25
Time: 14:30
Location: Office Hours Room 101
Scheduled by: Admin User

Notes: Please come prepared with your questions.
```

## Best Practices for Admins

1. **Clear Communication**: Provide specific details about what to prepare for the meeting
2. **Consistent Scheduling**: Use standard time slots when possible
3. **Location Details**: Include room numbers and building information
4. **Follow-up**: Check if students have questions about the scheduled meeting
5. **Documentation**: Keep notes about meeting outcomes in the complaint thread

## Troubleshooting

### Common Issues and Solutions

1. **Cannot Find Meeting Requests**
   - Ensure you're in the "Complaints" section
   - Check that complaints exist in the system
   - Look for the orange border and "MEETING" chip

2. **Scheduling Button Not Visible**
   - Confirm the complaint is a meeting request (starts with "[MEETING REQUEST]")
   - Refresh the complaint list if needed

3. **Student Not Receiving Notifications**
   - Verify the student has opened the app recently
   - Check that the reply was successfully added to the complaint
   - Ensure the student's device can receive notifications

## Technical Details

### Data Structure
Meeting requests are stored as regular complaints with:
- Topic prefixed with "[MEETING REQUEST]"
- Special visual indicators in the UI
- Structured replies for scheduling information

### Reply Format
When scheduling a meeting, the system creates a reply with this format:
```
MEETING SCHEDULED

Date: YYYY-MM-DD
Time: HH:MM
Location: Meeting location
Scheduled by: Admin Name

Additional notes if provided
```

This format allows the system to automatically extract and display meeting details to students.