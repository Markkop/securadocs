import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, ilike, ne, and } from "drizzle-orm";

// GET - Search users by email or name
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    const db = getDb();
    const searchTerm = `%${query.trim()}%`;

    // Search users by email or name, excluding current user
    const matchedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(
        and(
          ne(users.id, userId), // Exclude current user
          or(
            ilike(users.email, searchTerm),
            ilike(users.name, searchTerm)
          )
        )
      )
      .limit(10);

    return NextResponse.json({
      users: matchedUsers,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
