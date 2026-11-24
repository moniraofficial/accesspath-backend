PROJECT 04 — ACCESSPATH
Advanced Urban Accessibility & Mobility Platform
Project Category: AccessibilityTech
Difficulty Level: Advanced
1. Project Overview
Build a professional Urban Accessibility and Mobility Platform named AccessPath using Next.js.
The platform will help wheelchair users, elderly people, and individuals with mobility challenges discover accessible locations and routes.
Traditional navigation systems often recommend the shortest or fastest route without considering accessibility barriers such as stairs, broken footpaths, missing ramps, inaccessible elevators, and unsafe crossings.
AccessPath should solve this problem by providing accessibility-aware location discovery and route recommendations.
The system must support four primary roles: Admin, Regular User, Contributor, and Moderator.
The goal is to build an accessibility-focused platform with geospatial search, interactive maps, route scoring, community contributions, and report verification.
2. User Roles & Capabilities
Admin
Manage users.
Manage location categories.
Manage location information.
Manage accessibility data.
Monitor submitted reports.
View platform analytics.
Configure system settings.
Regular User
Search accessible places.
View location information.
Explore accessible routes.
View accessibility details.
Submit accessibility feedback.
Save favorite locations.
Report accessibility barriers.
Contributor
Submit new locations.
Update accessibility information.
Submit barrier reports.
Upload supporting photographs.
Provide location details.
Track submitted contributions.
Moderator
Verify submitted locations.
Review accessibility reports.
Approve or reject submissions.
Manage incorrect information.
Review community feedback.
Maintain information accuracy.
3. Core Features & Technical Requirements
A. Accessible Location Directory
Build a searchable directory of accessible public places.
Each location should contain:
Location Name.
Location Description.
Address.
GPS Coordinates.
Location Category.
Accessibility Score.
Accessibility Features.
Uploaded Photographs.
Verification Status.
Location Categories:
Public Buildings.
Parks.
Educational Institutions.
Transportation Facilities.
Government Offices.
Community Centers.
B. Accessibility Information Management
Each location should provide detailed accessibility information.
Required attributes:
Wheelchair Access.
Ramp Availability.
Elevator Availability.
Accessible Restroom.
Accessible Parking.
Stair-free Entry.
Door Accessibility.
The platform should display accessibility information clearly so users can make informed decisions before visiting a location.
C. Location Search System
Implement advanced location discovery.
Required features:
Search by Location Name.
Search by Address.
Nearby Locations.
Category Filtering.
Accessibility Feature Filtering.
Distance-based Sorting.
Accessibility Score Sorting.
GPS-based Search.
Location Details Page.
D. Route Discovery System
Build an accessibility-aware route discovery module.
Users should be able to enter:
Starting Location.
Destination.
The application should display:
Available Route Options.
Route Distance.
Estimated Travel Time.
Accessibility Barrier Information.
Route Accessibility Score.
Important Accessibility Warnings.
The platform must consider accessibility conditions rather than simply selecting the shortest route.
E. Barrier Reporting System
Users should be able to report accessibility barriers.
Barrier Categories:
Broken Footpath.
Missing Ramp.
Blocked Sidewalk.
Broken Elevator.
Unsafe Crossing.
Each report should contain:
Barrier Category.
Description.
Image Attachment.
GPS Location.
Submission Date.
Reporter Information.
Report Status.
F. Community Verification System
Implement a community-driven verification workflow.
Required features:
User Feedback.
Location Reviews.
Accessibility Information Updates.
Report Verification.
Moderator Approval.
Incorrect Information Management.
Contribution History.
G. Analytics Dashboard
Admin should be able to monitor:
Total Accessible Locations.
Total Barrier Reports.
Verified Reports.
Pending Reports.
Most Reported Areas.
Accessibility Category Distribution.
Monthly Report Trends.
Community Contribution Statistics.
4. Route Scoring & Accessibility Algorithm
Implement a basic accessibility-based route scoring algorithm.
The algorithm should evaluate route conditions using multiple factors.
Example scoring considerations:
Condition
Score Impact
Shorter Distance
Positive
Ramp Available
Positive
Elevator Available
Positive
Staircase
Negative
Broken Footpath
Negative
Unsafe Crossing
Negative

The system must rank routes using accessibility conditions, not distance alone.
Provide a clear explanation of the scoring algorithm in the project documentation.
5. Advanced Requirements
Map Integration.
Location-based Search.
Geospatial Filtering.
Route Scoring Algorithm.
Advanced Filtering.
Search Debouncing.
Server-side Pagination.
Location Clustering.
Image Upload.
Report Verification Workflow.
Interactive Analytics Charts.
Responsive UI.
Location-based Recommendations.
6. Security & Data Integrity
Users can manage their own contributions.
Contributors cannot directly approve their submissions.
Only moderators and authorized admins can verify locations.
Users cannot modify another user's reports.
GPS coordinates must be validated.
Location records must maintain accurate geographic information.
Route scoring must use verified accessibility data where available.
Unverified accessibility information must be clearly identified.
Favorite locations must be associated with the correct user.
7. Bonus Challenges
Personalized Accessibility Preferences.
Wheelchair-friendly Route Recommendations.
Accessibility Heatmaps.
Community Trust Score.
Automatic Duplicate Location Detection.
Location Accessibility Ranking.
Offline Saved Locations.
Voice-based Location Search.
PDF Accessibility Reports.
Dark Mode.
8. Minimum Data Requirements
Generated datasets may be used.
Minimum 10,000 Locations.
Minimum 50,000 Accessibility Reports.
Minimum 100,000 User Feedback Records.
The application should support efficient searching and filtering across large datasets.
9. Expected Pages
Landing Page.
Login & Registration.
Explore Locations.
Location Details.
Route Planner.
Map View.
Submit New Location.
Report Accessibility Barrier.
My Reports.
Favorite Locations.
Admin Dashboard.
Location Management.
Report Moderation.
Analytics Dashboard.
Profile Settings.
10. Tech Stack
Framework: Next.js (App Router).
Frontend: React.
Language: TypeScript (Preferred).
Styling: Tailwind CSS or Professional UI Library.
Charts: Recharts or Chart.js.
Maps: Any suitable Map Library.
Geospatial Search: Suitable Database or Geospatial Solution.
11. What to Submit
Fully Functional Application.
Complete Source Code.
GitHub Repository.
Live Deployment Link.
Database Design.
API Documentation.
Route Scoring Algorithm Explanation.
README.md.
Demo Credentials for All Four Roles.
Submission date: to be announced 
12. Evaluation Focus
Next.js Architecture.
Geospatial Data Management.
Map Integration.
Location-based Search.
Route Discovery.
Accessibility Scoring Algorithm.
Community Contribution Workflow.
Report Moderation.
Database Design.
Search Performance.
Large Dataset Handling.
Responsive UI/UX.
Security and Data Integrity.
The main objective is to demonstrate that you can build an intelligent accessibility-focused navigation platform that prioritizes usability and accessibility over conventional distance-based navigation.

