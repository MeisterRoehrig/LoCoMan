"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";

/** ======= 1. Type definition ======= */
export interface EmployeeDoc {
  id: string;
  jobtitel: string;          // keep the German key you asked for
  monthlySalaryEuro: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/** ======= 2. Context shape ======= */
interface EmployeesContextValue {
  employees: EmployeeDoc[];
  loadingEmployees: boolean;

  loadEmployees: () => Promise<void>;
  getEmployeeById: (employeeId: string) => EmployeeDoc | null;
  addEmployee: (data: Omit<EmployeeDoc, "id">) => Promise<string | undefined>;
  addEmployeeWithId: (
    data: Omit<EmployeeDoc, "id">,
    customId: string
  ) => Promise<string | undefined>;
  updateEmployee: (
    employeeId: string,
    data: Partial<EmployeeDoc>
  ) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
}

/** ======= 3. Context & Provider ======= */
const EmployeesContext = createContext<EmployeesContextValue>({
  employees: [],
  loadingEmployees: false,
  loadEmployees: async () => {},
  getEmployeeById: () => null,
  addEmployee: async () => undefined,
  addEmployeeWithId: async () => undefined,
  updateEmployee: async () => {},
  deleteEmployee: async () => {},
});

export function EmployeesProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  /* ---------- 3.1 Load all employees ---------- */
  async function loadEmployees() {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    setLoadingEmployees(true);
    try {
      const employeesRef = collection(firestore, "users", user.uid, "employees");
      const snap = await getDocs(employeesRef);
      const result: EmployeeDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          jobtitel: data.jobtitel || "",
          monthlySalaryEuro: data.monthlySalaryEuro ?? 0,
          createdAt: data.createdAt?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? null,
        };
      });
      setEmployees(result);
    } catch (err) {
      console.error("Error loading employees:", err);
      toast.error("Failed to load employees.");
    } finally {
      setLoadingEmployees(false);
    }
  }

  /* ---------- 3.2 Helpers ---------- */
  function getEmployeeById(id: string) {
    return employees.find((e) => e.id === id) ?? null;
  }

  /* ---------- 3.3 Create ---------- */
  async function addEmployee(data: Omit<EmployeeDoc, "id">) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = collection(firestore, "users", user.uid, "employees");
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Employee added!");
      await loadEmployees();
      return docRef.id;
    } catch (err) {
      console.error("Error adding employee:", err);
      toast.error("Failed to add employee.");
    }
  }

  async function addEmployeeWithId(
    data: Omit<EmployeeDoc, "id">,
    customId: string
  ) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "employees", customId);
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Employee added!");
      await loadEmployees();
      return ref.id;
    } catch (err) {
      console.error("Error adding employee with ID:", err);
      toast.error("Failed to add employee.");
    }
  }

  /* ---------- 3.4 Update ---------- */
  async function updateEmployee(
    employeeId: string,
    data: Partial<EmployeeDoc>
  ) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "employees", employeeId);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      toast.success("Employee updated!");
      await loadEmployees();
    } catch (err) {
      console.error("Error updating employee:", err);
      toast.error("Failed to update employee.");
    }
  }

  /* ---------- 3.5 Delete ---------- */
  async function deleteEmployee(employeeId: string) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "employees", employeeId);
      await deleteDoc(ref);
      toast.success("Employee deleted.");
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error("Failed to delete employee.");
    }
  }

  /* ---------- 3.6 Auto-load on mount ---------- */
  useEffect(() => {
    if (user && typeof user === "object" && "uid" in user) {
      loadEmployees();
    } else {
      setEmployees([]);
    }
  }, [user]);

  const value = useMemo<EmployeesContextValue>(
    () => ({
      employees,
      loadingEmployees,
      loadEmployees,
      getEmployeeById,
      addEmployee,
      addEmployeeWithId,
      updateEmployee,
      deleteEmployee,
    }),
    [employees, loadingEmployees]
  );

  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  );
}

/** ======= 4. Hook ======= */
export function useEmployees() {
  return useContext(EmployeesContext);
}
