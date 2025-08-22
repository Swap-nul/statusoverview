import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from '../app-config.service';

export interface BulkDeploymentPayload {
  projectName: string;
  fromEnvironment: string;
  toEnvironment: string;
  applications: {
    appName: string;
    version: string;
    branch: string;
  }[];
}

export interface JenkinsJobResponse {
  jobId: string;
  status: string;
  message: string;
  queueId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class JenkinsService {
  private jenkinsBaseUrl: string;
  private jenkinsApiUser: string;
  private jenkinsApiToken: string;

  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {
    // These should be configured in your config service
    this.jenkinsBaseUrl = this.configService.get('jenkinsBaseUrl') || '';
    this.jenkinsApiUser = this.configService.get('jenkinsApiUser') || '';
    this.jenkinsApiToken = this.configService.get('jenkinsApiToken') || '';
  }

  /**
   * Triggers a bulk deployment Jenkins job
   * @param payload The deployment configuration
   * @returns Observable with the Jenkins job response
   */
  triggerBulkDeployment(payload: BulkDeploymentPayload): Observable<JenkinsJobResponse> {
    const jenkinsJobName = this.configService.get('jenkinsBulkDeployJobName') || 'bulk-deployment-job';
    const url = `${this.jenkinsBaseUrl}/job/${jenkinsJobName}/buildWithParameters`;

    // Create Jenkins job parameters
    const formData = new FormData();
    formData.append('PROJECT_NAME', payload.projectName);
    formData.append('FROM_ENVIRONMENT', payload.fromEnvironment);
    formData.append('TO_ENVIRONMENT', payload.toEnvironment);
    formData.append('APPLICATIONS_JSON', JSON.stringify(payload.applications));
    formData.append('TRIGGER_USER', this.getCurrentUser());

    // Add authentication headers
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.post(url, formData, { 
      headers, 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map((response: HttpResponse<string>) => {
        // Jenkins returns a 201 status code for successful job creation
        if (response.status === 201) {
          // Extract queue ID from Location header if available
          const locationHeader = response.headers.get('Location');
          const queueId = this.extractQueueIdFromLocation(locationHeader);
          
          return {
            jobId: this.generateJobId(),
            status: 'TRIGGERED',
            message: `Bulk deployment job successfully triggered for ${payload.applications.length} applications`,
            queueId: queueId
          };
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      }),
      catchError(error => {
        console.error('Jenkins API Error:', error);
        
        let errorMessage = 'Failed to trigger bulk deployment job';
        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please check Jenkins credentials.';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied. User does not have access to trigger Jenkins jobs.';
        } else if (error.status === 404) {
          errorMessage = 'Jenkins job not found. Please check job configuration.';
        } else if (error.error) {
          errorMessage = `Jenkins error: ${error.error}`;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Gets the status of a Jenkins job
   * @param jobId The Jenkins job ID or build number
   * @returns Observable with job status
   */
  getJobStatus(jobId: string): Observable<any> {
    const jenkinsJobName = this.configService.get('jenkinsBulkDeployJobName') || 'bulk-deployment-job';
    const url = `${this.jenkinsBaseUrl}/job/${jenkinsJobName}/${jobId}/api/json`;

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching Jenkins job status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets the console output of a Jenkins job
   * @param jobId The Jenkins job ID or build number
   * @returns Observable with console output
   */
  getJobConsoleOutput(jobId: string): Observable<string> {
    const jenkinsJobName = this.configService.get('jenkinsBulkDeployJobName') || 'bulk-deployment-job';
    const url = `${this.jenkinsBaseUrl}/job/${jenkinsJobName}/${jobId}/consoleText`;

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Error fetching Jenkins console output:', error);
        return throwError(() => error);
      })
    );
  }

  private extractQueueIdFromLocation(locationHeader: string | null): number | undefined {
    if (!locationHeader) return undefined;
    
    const queueMatch = locationHeader.match(/\/queue\/item\/(\d+)\//);
    return queueMatch ? parseInt(queueMatch[1], 10) : undefined;
  }

  private generateJobId(): string {
    return `bulk-deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUser(): string {
    // This should get the current user from your authentication service
    // For now, returning a placeholder
    return 'status-overview-user';
  }

  /**
   * Validates Jenkins connectivity and authentication
   * @returns Observable boolean indicating if Jenkins is accessible
   */
  validateJenkinsConnection(): Observable<boolean> {
    const url = `${this.jenkinsBaseUrl}/api/json`;
    
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { headers }).pipe(
      map(() => true),
      catchError(() => {
        return throwError(() => false);
      })
    );
  }
}
