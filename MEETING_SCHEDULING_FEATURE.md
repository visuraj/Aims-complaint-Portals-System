# Admin Meeting Scheduling Feature

## Overview
This feature allows admins to directly schedule meeting time slots for students who have exceeded their weekly complaint limit (10 complaints per week). When a student reaches their limit, they can request a meeting with an admin, and admins can then schedule specific times and locations for these meetings.

## Implementation Details

### 1. New Admin Schedule Meeting Screen
- **File**: `screens/admin/ScheduleMeetingScreen.tsx`
- Allows admins to schedule direct meetings with students
- Collects:
  - Meeting date
  - Meeting time
  - Meeting location
  - Additional notes
- Submits scheduling information as a reply to the meeting request complaint

### 2. Enhanced Admin Complaint Details
- **File**: `screens/admin/AdminComplaintDetails.tsx`
- Added "Schedule Meeting with Student" button for meeting requests
- Button only appears for complaints with "[MEETING REQUEST]" prefix
- Navigates to the new scheduling screen with complaint data

### 3. Student Dashboard Notifications
- **File**: `screens/student/StudentDashboard.tsx`
- Added modal notification when a meeting is scheduled
- Automatically detects scheduled meetings from complaint replies
- Shows meeting details (date, time, location) in a popup
- Provides option to view full meeting details

### 4. Admin Navigation
- **File**: `navigation/AdminStack.tsx`
- Added new ScheduleMeeting screen to admin navigation stack

## User Flow

### Student Process
1. Student submits complaints up to weekly limit (10 complaints)
2. When limit is reached, student can request a meeting through the "Schedule Meeting" option
3. Student receives notification when admin schedules a meeting
4. Student can view meeting details in the complaint thread

### Admin Process
1. Admin identifies meeting requests in complaint management (visually highlighted)
2. Admin opens complaint details to see meeting request
3. Admin clicks "Schedule Meeting with Student" button
4. Admin fills out scheduling form with date, time, location
5. System sends notification to student with meeting details

## Technical Implementation

### Data Structure
- Meeting requests are stored as complaints with "[MEETING REQUEST]" prefix
- Meeting scheduling information is stored as replies to the complaint
- Special reply format allows automatic extraction of meeting details

### Special Reply Format
```
MEETING SCHEDULED

Date: 2025-12-25
Time: 14:30
Location: Office Hours Room 101
Scheduled by: Admin User

Notes: Please come prepared with your questions.
```

### Visual Indicators
- Meeting requests have orange border and "MEETING" chip in complaint list
- Banner notification in complaint details for meeting requests
- Modal popup in student dashboard for scheduled meetings

## Features

### 1. Direct Scheduling
- Admins can directly schedule time slots for students
- No back-and-forth communication needed for basic scheduling
- All scheduling information stored in complaint thread

### 2. Automatic Notifications
- Students automatically notified when meetings are scheduled
- Meeting details extracted and displayed in modal popup
- Full details available in complaint thread

### 3. Visual Organization
- Easy identification of meeting requests in admin interface
- Clear separation between regular complaints and meeting requests
- Consistent styling throughout the application

## Future Enhancements

1. **Calendar Integration**
   - Integrate with admin calendar systems
   - Send calendar invites to students

2. **Automated Email Notifications**
   - Send email notifications when meetings are scheduled
   - Include calendar attachments

3. **Meeting Status Tracking**
   - Add status tracking for scheduled meetings (completed, rescheduled, etc.)
   - Allow students to confirm attendance

4. **Recurring Meetings**
   - Support for recurring meeting schedules
   - Bulk scheduling for multiple students

5. **Meeting Reminders**
   - Automated reminders before scheduled meetings
   - Configurable reminder times

## Files Created/Modified

### New Files
- `screens/admin/ScheduleMeetingScreen.tsx` - Admin meeting scheduling form
- `MEETING_SCHEDULING_FEATURE.md` - This documentation

### Modified Files
- `navigation/AdminStack.tsx` - Added ScheduleMeeting screen
- `screens/admin/AdminComplaintDetails.tsx` - Added scheduling button and banner
- `screens/student/StudentDashboard.tsx` - Added meeting scheduled notification
- `test-meeting-scheduling.js` - Test script for verification

## Testing

The feature was designed to integrate seamlessly with the existing complaint workflow:
- Meeting requests use the same data structure as regular complaints
- Scheduling information is stored as replies for consistency
- All existing complaint functionality remains unchanged