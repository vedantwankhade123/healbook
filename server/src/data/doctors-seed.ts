export type DoctorSeed = Record<string, unknown>;
export type FacilitySeed = Record<string, unknown>;

export const hospitalProfiles: Partial<FacilitySeed>[] = [
  { id: "hosp_rad_amr", name: "Radiant Superspeciality Hospital", type: "hospital", city: "Amravati", specializations: ["Neurology", "Cardiology", "Internal Medicine"] },
  { id: "hosp_city_delhi", name: "Prana Health Center", type: "clinic", city: "Delhi", specializations: ["General Physician", "Homeopathy"] },
  { id: "hosp_unity_bang", name: "Unity Health Bangalore", type: "hospital", city: "Bangalore", specializations: ["Internal Medicine", "Pediatrics"] },
  { id: "hosp_nag_heart", name: "Nagpur Heart Institute", type: "hospital", city: "Nagpur", specializations: ["Cardiology", "Internal Medicine"] },
  { id: "hosp_mumbai_mind", name: "Parekh Mind & Neuro Center", type: "clinic", city: "Mumbai", specializations: ["Psychiatry", "Neurology"] },
  { id: "hosp_pune_gen", name: "Kulkarni Superspeciality Hospital", type: "hospital", city: "Pune", specializations: ["General Surgeon", "Neurology", "Cardiology"] },
  { id: "hosp_aiims_delhi", name: "AIIMS Delhi", type: "hospital", city: "Delhi", specializations: ["Oncology", "Cardiology", "Neurology", "Nephrology"] },
  { id: "hosp_apollo_bang", name: "Apollo Hospitals", type: "hospital", city: "Bangalore", specializations: ["Cardiology", "Orthopedic", "Gastroenterologist"] },
  { id: "hosp_max_delhi", name: "Max Super Speciality Hospital", type: "hospital", city: "Delhi", specializations: ["Oncology", "Urology", "Internal Medicine"] },
  { id: "hosp_fortis_gur", name: "Fortis Memorial Research Institute", type: "hospital", city: "Gurugram", specializations: ["Neurology", "Oncology", "Pediatrics"] },
  { id: "hosp_lila_mumbai", name: "Lilavati Hospital", type: "hospital", city: "Mumbai", specializations: ["Cardiology", "General Surgeon", "Gynecologist"] },
  { id: "hosp_manipal_bang", name: "Manipal Hospital", type: "hospital", city: "Bangalore", specializations: ["Neurology", "Nephrology", "Internal Medicine"] },
  { id: "hosp_hinduja_mumbai", name: "P.D. Hinduja Hospital", type: "hospital", city: "Mumbai", specializations: ["Oncology", "Orthopedic", "Psychiatry"] },
  { id: "hosp_medanta_gur", name: "Medanta - The Medicity", type: "hospital", city: "Gurugram", specializations: ["Cardiology", "Urology", "Gastroenterologist"] },
  { id: "hosp_cmc_vellore", name: "Christian Medical College", type: "hospital", city: "Vellore", specializations: ["Internal Medicine", "Ophthalmologist", "Neurology"] },
  { id: "hosp_tata_mumbai", name: "Tata Memorial Hospital", type: "hospital", city: "Mumbai", specializations: ["Oncology", "Radiology", "General Surgeon"] },
  { id: "hosp_max_gur", name: "Max Hospital Gurugram", type: "hospital", city: "Gurugram", specializations: ["General Physician", "Cardiology", "Neurology"] },
  { id: "hosp_care_nag", name: "Care Hospital Nagpur", type: "hospital", city: "Nagpur", specializations: ["Orthopedic", "General Physician", "Pediatrics"] },
  { id: "hosp_sahyadri_pune", name: "Sahyadri Hospital", type: "hospital", city: "Pune", specializations: ["Neurology", "Cardiology", "Pediatrics"] },
  { id: "hosp_global_chennai", name: "Global Hospital Chennai", type: "hospital", city: "Chennai", specializations: ["Gastroenterologist", "Nephrology", "Oncology"] }
];

const generateDoctors = () => {
  const doctors: Partial<DoctorSeed>[] = [];
  const specializations = [
    { spec: "General Physician", symptoms: ["Fever", "Cough", "Cold", "Flu", "Infection", "Headache", "Body Ache", "Weakness", "Viral Fever"] },
    { spec: "Pediatrician", symptoms: ["Child Fever", "Child Cough", "Vaccination", "Newborn Care", "Growth Monitoring", "Childhood Illness"] },
    { spec: "Cardiologist", symptoms: ["Chest Pain", "Heart Pain", "Palpitations", "High BP", "Heart Attack", "Dizziness", "Breathlessness"] },
    { spec: "Dermatologist", symptoms: ["Skin Infection", "Acne", "Rashes", "Itching", "Hair Loss", "Pigmentation", "Eczema", "Psoriasis"] },
    { spec: "Orthopedic", symptoms: ["Back Pain", "Joint Pain", "Body Pain", "Fracture", "Knee Pain", "Spine Pain", "Spondylitis"] },
    { spec: "Neurologist", symptoms: ["Headache", "Migraine", "Seizures", "Tremors", "Memory Loss", "Numbness", "Stroke Recovery"] },
    { spec: "Gastroenterologist", symptoms: ["Stomach Pain", "Acidity", "Bloating", "Jaundice", "Liver Issues", "Constipation", "Indigestion"] },
    { spec: "Psychiatrist", symptoms: ["Stress", "Anxiety", "Depression", "Sleep Problems", "Mood Swings", "Behavioral Issues"] },
    { spec: "Gynecologist", symptoms: ["Pregnancy", "PCOS", "Menstrual Pain", "Women Health", "Infertility", "Menopause"] },
    { spec: "ENT Specialist", symptoms: ["Ear Pain", "Sinusitis", "Sore Throat", "Snoring", "Vertigo", "Hearing Loss"] }
  ];

  const cities = ["Delhi", "Mumbai", "Bangalore", "Pune", "Nagpur", "Amravati", "Gurugram", "Hyderabad", "Chennai", "Jaipur"];
  const names = [
    "Sharma", "Gupta", "Verma", "Singh", "Malhotra", "Kapoor", "Jain", "Reddy", "Nair", "Patil",
    "Deshmukh", "Kulkarni", "Mehta", "Bansal", "Shah", "Iyer", "Pillai", "Yadav", "Bajaj", "Ghone",
    "Pawar", "Kadam", "Rao", "Jha", "Mishra", "Trivedi", "Pandey", "Chauhan", "Agarwal", "Saxena",
    "Srivastava", "Desai", "Merchant", "Parekh", "Adwani", "Chandak", "Bhutada", "Vaidya", "Rathi", "Lanjewar"
  ];
  const firstNames = ["Dr. Amit", "Dr. Neha", "Dr. Rahul", "Dr. Anjali", "Dr. Vikram", "Dr. Priya", "Dr. Sanjay", "Dr. Meera", "Dr. Arvind", "Dr. Shweta", "Dr. Rajesh", "Dr. Kavita", "Dr. Nitin", "Dr. Snehal", "Dr. Ashish", "Dr. Vaishali", "Dr. Sameer", "Dr. Tanuja", "Dr. Manish", "Dr. Prerna", "Dr. Harpreet", "Dr. Aruna", "Dr. Kailash", "Dr. Varsha", "Dr. Prashant", "Dr. Shailesh", "Dr. Deepali", "Dr. Girish", "Dr. Vinay", "Dr. Shubhada", "Dr. Ajay", "Dr. Leena", "Dr. Abhishek", "Dr. Monica", "Dr. Sandeep", "Dr. Niharika", "Dr. Pallavi", "Dr. Swati", "Dr. Dev", "Dr. Anita"];

  let idCounter = 1;
  specializations.forEach((s) => {
    // Generate at least 20 doctors per specialization to ensure 15+ for related symptoms
    for (let i = 0; i < 22; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = names[Math.floor(Math.random() * names.length)];
      const fullName = `${firstName} ${lastName}`;
      
      doctors.push({
        name: fullName,
        email: `${fullName.toLowerCase().replace(/[\s\.]+/g, "_")}${idCounter++}@healbook.in`,
        specialization: s.spec,
        experience: 5 + Math.floor(Math.random() * 25),
        clinicName: `${lastName} Clinical Center, ${city}`,
        consultationFee: 400 + Math.floor(Math.random() * 2000),
        bio: `Specialist in ${s.spec} with a focus on patient-centric outcomes and modern clinical practices.`,
        education: `MBBS, MD (${s.spec}) - Top Medical Institute`,
        languages: ["English", "Hindi", city === "Mumbai" || city === "Pune" || city === "Nagpur" || city === "Amravati" ? "Marathi" : "Local Language"],
        rating: 4.5 + Math.random() * 0.5,
        isAvailable: true,
        treats: s.symptoms,
        profilePhoto: `https://images.unsplash.com/photo-${1500000000000 + idCounter}?q=80&w=2000&auto=format&fit=crop`,
      });
    }
  });

  return doctors;
};

export const doctorProfiles = generateDoctors();

export const generateExtendedDataset = () => {
    return {
        doctors: doctorProfiles,
        facilities: hospitalProfiles
    };
};
