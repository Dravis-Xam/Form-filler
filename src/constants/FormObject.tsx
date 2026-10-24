export interface MarriageCertificateForm {
  ceremony: {
    solemnizedAt: string;
    location: string;
    subCounty: string;
    county: string;
    dateOfMarriage: string;
    marriageEntryNumber: string;
  };

  bridegroom: {
    name: string;
    age: string;
    maritalStatus: string;
    residenceAtMarriage: string;
    county: string;
    subCounty: string;
    occupation: string;

    father: {
      name: string;
      occupation: string;
      residence: string;
    };

    mother: {
      name: string;
      occupation: string;
      residence: string;
    };
  };

  bride: {
    name: string;
    age: string;
    maritalStatus: string;
    residenceAtMarriage: string;
    county: string;
    subCounty: string;
    occupation: string;

    father: {
      name: string;
      occupation: string;
      residence: string;
    };

    mother: {
      name: string;
      occupation: string;
      residence: string;
    };
  };

  registration: {
    marriedIn: string;
    registrarCertificateOrSpecialLicenseNumber: string;
    officiatedBy: string;
    parties: [string, string];
    witnesses: [string, string];
  };
}

export const marriageCertificateForm: MarriageCertificateForm = {
  ceremony: {
    solemnizedAt: "",
    location: "",
    subCounty: "",
    county: "",
    dateOfMarriage: "",
    marriageEntryNumber: "",
  },

  bridegroom: {
    name: "",
    age: "",
    maritalStatus: "",
    residenceAtMarriage: "",
    county: "",
    subCounty: "",
    occupation: "",

    father: {
      name: "",
      occupation: "",
      residence: "",
    },

    mother: {
      name: "",
      occupation: "",
      residence: "",
    },
  },

  bride: {
    name: "",
    age: "",
    maritalStatus: "",
    residenceAtMarriage: "",
    county: "",
    subCounty: "",
    occupation: "",

    father: {
      name: "",
      occupation: "",
      residence: "",
    },

    mother: {
      name: "",
      occupation: "",
      residence: "",
    },
  },

  registration: {
    marriedIn: "",
    registrarCertificateOrSpecialLicenseNumber: "",
    officiatedBy: "",
    parties: ["", ""],
    witnesses: ["", ""],
  },
};