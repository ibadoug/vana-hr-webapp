export interface EmployeeDocument {
    id: string;
    name: string;
    dataUrl: string; // Base64 encoded file
    uploadedAt: string; // ISO String
    folderId?: string; // Optional reference to a folder
}

export interface DocumentFolder {
    id: string;
    name: string;
    createdAt: string; // ISO String
}

export interface TimeOffRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string; // ISO String
}

export interface Employee {
    id: string;
    photoUrl?: string; // Optional URL or base64
    firstName: string;
    lastName: string;
    email: string;
    hireDate: string; // YYYY-MM-DD
    employmentStatus: 'Full Time' | 'Part Time' | 'Contractor' | 'Intern';
    department: 'HR' | 'Data Science' | 'BI' | 'Engineering' | 'Sales' | 'Marketing' | 'Product' | 'Customer Support' | 'Lending Ops' | 'Legal' | 'Compliance' | 'Finance' | 'Risk' | 'Collection' | string;
    location: string;
    city?: string; // Derived from location or added for forms
    country?: string; // Derived from location or added for forms
    jobTitle: string;
    reportingTo: string; // Name of manager
    status: 'Active' | 'Inactive' | 'Onboarding' | 'Pending Approval';
    lastDay?: string; // YYYY-MM-DD
    bankName?: string;
    bankAccountNumber?: string;
    realTimeStatus?: 'Active' | 'Out of Office' | 'Birthday' | 'Anniversary'; // Additional badge
    documents?: EmployeeDocument[]; // Support for HR requested forms uploaded by the employee
    documentFolders?: DocumentFolder[]; // Support for grouping documents into folders
    hrDocuments?: EmployeeDocument[]; // Support for HR specific documents
    hrDocumentFolders?: DocumentFolder[]; // Support for grouping HR documents into folders
    timeOffRequests?: TimeOffRequest[]; // Support for time off requests
    legalEntity?: string; // Support for legal entity of employment


    // Onboarding form fields
    nationalId?: string; // DPI/DNI
    dateOfBirth?: string;
    taxId?: string; // NIT
    phoneNumber?: string;
    homeAddress?: string;
    nationality?: string;
    personalEmail?: string;
    maritalStatus?: 'Soltero' | 'Casado' | 'Unido' | string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    bankAccountType?: 'Monetaria' | 'Ahorro' | 'N/A' | string;
    igssAffiliation?: string;
    gender?: 'Femenino' | 'Masculino' | string;
    medicalConditions?: string; // Enfermedades/Alergias
    profession?: string; // Profesión u Oficio
    academicLevel?: 'Básicos' | 'Diversificado' | 'Técnico' | 'Licenciatura' | 'Maestría' | 'Doctorado' | string;
    degreeTitle?: string; // Título obtenido
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Desconozco' | string;
    tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'XXXXL' | string;
    contractingCompany?: 'Vana' | 'Easy' | 'Krece' | 'Vana Card' | string;
}
