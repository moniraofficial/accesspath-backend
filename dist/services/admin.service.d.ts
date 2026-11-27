import { IAuthUser, IPaginationMeta, IUserResponse } from "../types/index.js";
import { IAdminUpdateUserInput, IAdminUsersQuery } from "../validations/admin.validation.js";
export declare function listUsersForAdmin(query: IAdminUsersQuery): Promise<{
    items: IUserResponse[];
    meta: IPaginationMeta;
}>;
export declare function updateUserByAdmin(targetUserId: string, updates: IAdminUpdateUserInput, currentAdmin: IAuthUser): Promise<IUserResponse>;
export declare function getPlatformAnalytics(): Promise<{
    summary: {
        totalLocations: number;
        verifiedLocations: number;
        pendingLocations: number;
        rejectedLocations: number;
        totalBarrierReports: number;
        verifiedReports: number;
        pendingReports: number;
        resolvedReports: number;
        rejectedReports: number;
        totalFeedbackRecords: number;
    };
    accessibilityCategoryDistribution: {
        category: any;
        count: any;
        avgAccessibilityScore: number;
    }[];
    barrierCategoryDistribution: {
        category: any;
        count: any;
    }[];
    mostReportedAreas: any[];
    monthlyReportTrends: any[];
    communityContributionStats: {
        usersByRole: {
            role: any;
            count: any;
        }[];
        topLocationContributors: any[];
        topBarrierReporters: any[];
    };
}>;
//# sourceMappingURL=admin.service.d.ts.map